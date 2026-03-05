import { parseArgs } from 'util';
import { access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const split = async () => {
  // File source.txt should be either in project folder or in src/streams

  const DEFAULT_LINES = '10';
  const FILE_NAME = 'source.txt';

  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const getFilePath = async (pathToRoot, pathToThisFolder, fileName) => {
    let isFileInRoot;
    let isFileInThisFolder;
    const pathToFileInRoot = join(pathToRoot, fileName);
    const pathToFileInThisFolder = join(pathToThisFolder, fileName);
    try {
      await access(pathToFileInRoot);
      return pathToFileInRoot;
    } catch (err) {
      isFileInRoot = false;
    }
    try {
      await access(pathToFileInThisFolder);
      return pathToFileInThisFolder;
    } catch (err) {
      isFileInThisFolder = false;
    }
    if (!isFileInRoot && !isFileInThisFolder) {
      throw new Error('File source.txt not found');
    }
  };

  let pathToSourceFile;
  try {
    pathToSourceFile = await getFilePath(
      pathToRoot,
      pathToThisFolder,
      FILE_NAME,
    );
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. File named source.txt should be either in project root folder or in src/streams folder.',
    );
    return;
  }

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
