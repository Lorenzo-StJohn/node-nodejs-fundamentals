import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parseArgs } from 'node:util';

const filter = () => {
  //In some shells original command may not work correctly,
  // in that case you can try this command instead:
  // node -e "process.stdout.write('hello\\nworld\\ntest')" | node src/streams/filter.js --pattern test
  // ot this:
  // (echo hello & echo world & echo test) | node src/streams/filter.js --pattern test

  // pattern should be valid regex, in any other case default pattern /.*/ will be used instead
  // starting and finishing slashes will be added automatically, don't add them to your pattern

  const options = {
    pattern: {
      type: 'string',
      default: '/.*/',
    },
  };
  let pattern;
  try {
    const { values } = parseArgs({ options, strict: false });
    const patternRaw = values.pattern;
    const patternStr = typeof patternRaw === 'string' ? patternRaw : '.*';
    const patternStrWithSlashes = `/${patternStr}/`;
    const match = patternStrWithSlashes.match(/^\/(.*)\/([dgimsuvy]*)$/i);
    if (match) {
      const [, source, flags] = match;
      pattern = new RegExp(source, flags);
    } else {
      pattern = /.*/;
    }
  } catch (err) {
    console.error(err);
    console.log('P. S. Reading arguments failed.');
    return;
  }

  const createFilterTransform = (pattern) => {
    return new Transform({
      transform(chunk, encoding, callback) {
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
  };

  const handlePipeline = async (...items) => {
    try {
      await pipeline(...items);
    } catch (err) {
      console.error(err);
      return;
    }
  };

  void handlePipeline(
    process.stdin,
    createFilterTransform(pattern),
    process.stdout,
  );
};

filter();
