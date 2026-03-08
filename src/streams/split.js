import { parseArgs } from 'node:util';
import { access, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReadStream, createWriteStream } from 'node:fs';
import { Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const split = async () => {
  // File source.txt should be either in project folder or in src/streams
  // Chunk files will be created in chunks folder in src/streams

  const DEFAULT_LINES = '10';
  const INPUT_FILE_NAME = 'source.txt';
  const OUTPUT_FILE_NAME = 'chunk_';
  const OUTPUT_FOLDER_NAME = 'chunks';

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

  const readStream = createReadStream(pathToSourceFile);

  const createTransformToOneLine = (lines) =>
    new Transform({
      transform(chunk, encoding, callback) {
        this.counter ??= 0;
        const END_LINE = /\r?\n/;
        const inputString = chunk.toString('utf8');
        this.accumulatedString ??= '';
        this.accumulatedString += inputString;
        const stringSplitted = this.accumulatedString.split(END_LINE);
        this.accumulatedString = stringSplitted.pop();
        for (let i = 0; i < stringSplitted.length; ++i) {
          this.counter++;
          if (this.counter % lines === 0) {
            if (stringSplitted[i] === '') {
              this.push('\n\n');
            } else {
              this.push(stringSplitted[i]);
            }
          } else {
            this.push(stringSplitted[i] + '\n');
          }
        }
        callback();
      },

      flush(callback) {
        this.push(this.accumulatedString);
        callback();
      },
    });

  class ConditionalFileWriter extends Writable {
    constructor(outputNameStarter, path, lines, ...options) {
      super(...options);
      this.streams = [];
      this.counter = 0;
      this.outputNameStarter = outputNameStarter;
      this.path = path;
      this.lines = lines;
    }

    _write(chunk, encoding, callback) {
      ++this.counter;
      const fileNumber = Math.ceil(this.counter / this.lines);
      const file = join(
        this.path,
        `${this.outputNameStarter}${fileNumber}.txt`,
      );

      if (this.streams.length < fileNumber) {
        this.streams.push(createWriteStream(file, { flags: 'a' }));
      }

      if (chunk.toString() === '\n\n') {
        this.streams[fileNumber - 1].write(Buffer.from(''), encoding, callback);
      } else {
        this.streams[fileNumber - 1].write(chunk, encoding, callback);
      }
    }

    _destroy(err, callback) {
      for (const stream of this.streams) {
        stream.end();
      }
      callback(err);
    }
  }

  const pathToOutputFolder = join(pathToThisFolder, OUTPUT_FOLDER_NAME);
  const customWritableStream = new ConditionalFileWriter(
    OUTPUT_FILE_NAME,
    pathToOutputFolder,
    lines,
  );

  const handlePipeline = async (...items) => {
    try {
      await pipeline(...items);
    } catch (err) {
      console.error(err);
      return;
    }
  };

  const createFolder = async (pathToFolder) => {
    try {
      await rm(pathToFolder, { force: true, recursive: true });
      await mkdir(pathToFolder, { recursive: true });
    } catch (err) {
      throw new Error('Attempt to create/recreate chunks folder failed');
    }
  };

  try {
    await createFolder(pathToOutputFolder);
  } catch (err) {
    console.error(err);
    return;
  }

  await handlePipeline(
    readStream,
    createTransformToOneLine(lines),
    customWritableStream,
  );
};

await split();
