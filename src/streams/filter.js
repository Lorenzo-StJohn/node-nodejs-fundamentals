import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

const filter = () => {
  // Write your code here
  // Read from process.stdin
  // Filter lines by --pattern CLI argument
  // Use Transform Stream
  // Write to process.stdout

  const filterTransform = new Transform({
    transform(chunk, encoding, callback) {
      const pattern = /a.c/;
      const END_LINE = /\r?\n/;
      const inputString = chunk.toString('utf8');
      const inputLines = inputString.split(END_LINE);
      if (inputLines.length > 1 && inputLines.at(-1) === '') {
        inputLines.pop();
      }
      let outputString = [];
      let isSatisfied = false;
      for (const inputLine of inputLines) {
        const linesSplitted = inputLine.split('\\n');
        const outputArr = [];
        for (const lineSplitted of linesSplitted) {
          if (lineSplitted.match(pattern)) {
            outputArr.push(lineSplitted);
            isSatisfied = true;
          }
        }
        const outputLine = outputArr.join('\\n');
        if (isSatisfied) {
          outputString.push(outputLine);
        }
      }
      if (outputString.length > 0) {
        callback(null, outputString.join('\n') + '\n');
      } else {
        callback();
      }
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

  void handlePipeline(process.stdin, filterTransform, process.stdout);
};

filter();
