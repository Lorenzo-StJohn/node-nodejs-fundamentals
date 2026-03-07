import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

const lineNumberer = () => {
  const lineNumberTransform = new Transform({
    transform(chunk, encoding, callback) {
      const END_LINE = /(\r?\n)/;
      const inputString = chunk.toString('utf8');
      const inputLines = inputString.split(END_LINE);
      if (
        inputLines.length > 2 &&
        inputLines.at(-2).match(END_LINE) &&
        inputLines.at(-1) === ''
      ) {
        inputLines.pop();
        inputLines.pop();
      }
      let outputString = '';
      this.lineCount ??= 1;
      for (const inputLine of inputLines) {
        if (inputLine.match(END_LINE)) {
          outputString += inputLine.replace('\n', '\\n').replace('\r', '\\r');
        } else {
          const linesSplitted = inputLine.split('\\n');
          const outputArr = [];
          for (const lineSplitted of linesSplitted) {
            outputArr.push(`${this.lineCount++} | ${lineSplitted}`);
          }
          const outputLine = outputArr.join('\\n');
          outputString += outputLine;
        }
      }
      outputString += '\n';
      callback(null, outputString);
    },
  });

  const handlePipeline = async (...items) => {
    try {
      await pipeline(...items);
    } catch (err) {
      console.error(err);
      return;
    }
  };

  void handlePipeline(process.stdin, lineNumberTransform, process.stdout);
};

lineNumberer();
