import { parseArgs } from 'util';

const split = async () => {
  // Write your code here
  // Read source.txt using Readable Stream
  // Split into chunk_1.txt, chunk_2.txt, etc.
  // Each chunk max N lines (--lines CLI argument, default: 10)

  const DEFAULT_LINES = '10';

  const options = {
    lines: {
      type: 'string',
      default: DEFAULT_LINES,
    },
  };
  let lines;
  try {
    const { values } = parseArgs({ options, strict: false });
    const linesRaw = values.lines;
    const linesString = typeof linesRaw === 'string' ? linesRaw : DEFAULT_LINES;
    const linesInt = parseInt(linesString);
    lines = isNaN(linesInt) || linesInt < 1 ? +DEFAULT_LINES : linesInt;
  } catch (err) {
    console.error(err);
    console.log('P. S. Reading arguments failed.');
    return;
  }
};

await split();
