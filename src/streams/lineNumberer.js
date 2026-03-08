import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const lineNumberer = () => {
  // In some shells original command may not work correctly,
  // in that case you can try this command instead:
  // node -e "process.stdout.write('hello\\nworld')" | node src/streams/lineNumberer.js
  // ot this:
  // (echo hello & echo world) | node src/streams/lineNumberer.js

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
