import { parseArgs } from 'util';
import { access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, createWriteStream } from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

const split = async () => {
  // File source.txt should be either in project folder or in src/streams

  const DEFAULT_LINES = '10';
  const INPUT_FILE_NAME = 'source.txt';
  const OUTPUT_FILE_NAME = 'chunk_';

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
      INPUT_FILE_NAME,
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

  const path = join(pathToThisFolder, `${OUTPUT_FILE_NAME}1.txt`);
  const readStream = createReadStream(pathToSourceFile);
  const writeStream = createWriteStream(path);

  const transformToOneLine = new Transform({
    transform(chunk, encoding, callback) {
      const END_LINE = /\r?\n/;
      const inputString = chunk.toString('utf8');
      this.accumulatedString ??= '';
      this.accumulatedString += inputString;
      const stringSplitted = this.accumulatedString.split(END_LINE);
      this.accumulatedString = stringSplitted.pop();
      for (let i = 0; i < stringSplitted.length; ++i) {
        this.push(stringSplitted[i] + '\n');
      }
      callback();
    },

    flush(callback) {
      this.push(this.accumulatedString);
      callback();
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
  void handlePipeline(readStream, transformToOneLine, writeStream);
};

await split();
