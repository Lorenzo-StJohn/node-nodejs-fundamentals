import { parseArgs } from 'util';

const findByExt = async () => {
  // Write your code here
  // Recursively find all files with specific extension
  // Parse --ext CLI argument (default: .txt)
  const options = {
    ext: {
      type: 'string',
      default: 'txt',
    },
  };
  let ext;
  try {
    const { values } = parseArgs({ options });
    ext = values.ext;
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. There are should be either exactly one argument named ext with its value or no arguments at all.',
    );
  }
};

await findByExt();
