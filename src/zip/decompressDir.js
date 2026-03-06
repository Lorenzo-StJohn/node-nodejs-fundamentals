import { access, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream, createReadStream } from 'fs';
import { Buffer } from 'buffer';
import { brotliDecompress } from 'zlib';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const decompressDir = async () => {
  // Folder workspace should be either in project root folder or in src/zip
  // Folder compressed with archive.br inside it should be inside workspace folder

  const START_METADATA = '?';
  const END_METADATA = '!';
  const START_CONTENT = '_';
  const END_CONTENT = '#';
  const INPUT_FILE_PATHS = ['workspace', 'compressed', 'archive.br'];
  const OUTPUT_FOLDER_NAME = 'decompressed';

  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const getFilePath = async (pathToRoot, pathToThisFolder, filePath) => {
    let isFileInRoot;
    let isFileInThisFolder;
    const pathToFileInRoot = join(pathToRoot, ...filePath);
    const pathToFileInThisFolder = join(pathToThisFolder, ...filePath);
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
      throw new Error('FS operation failed');
    }
  };

  let pathToInputFile;
  try {
    pathToInputFile = await getFilePath(
      pathToRoot,
      pathToThisFolder,
      INPUT_FILE_PATHS,
    );
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. Folder workspace should be either in project root folder or in src/zip, compressed/archive.br should be inside workspace',
    );
    return;
  }

  const pathToOutputFolder = join(
    pathToInputFile,
    '..',
    '..',
    OUTPUT_FOLDER_NAME,
  );

  const createFolder = async (pathToFolder) => {
    try {
      await rm(pathToFolder, { force: true, recursive: true });
      await mkdir(pathToFolder, { recursive: true });
    } catch (err) {
      console.log(err);
      throw new Error('Attempt to create/recreate decompressed folder failed');
    }
  };

  try {
    await createFolder(pathToOutputFolder);
  } catch (err) {
    console.error(err);
    return;
  }

  const decompress = promisify(brotliDecompress);

  const handleMetadata = async (metadata, pathToOutputFolder) => {
    const metadataBuffer = Buffer.from(metadata, 'base64');
    const metadataJson = await decompress(metadataBuffer);
    const metadataObj = JSON.parse(metadataJson);
    const path = join(pathToOutputFolder, metadataObj.path);
    if (metadataObj.type === 'directory') {
      await mkdir(path);
    }
    return path;
  };

  const handleContent = async (currentFile, entry) => {
    const entryBuffer = Buffer.from(entry, 'base64');
    const entryDecompressed = await decompress(entryBuffer);
    const writeStream = createWriteStream(currentFile, { flags: 'a' });
    await pipeline(Readable.from(entryDecompressed), writeStream);
  };

  const processInput = async (pathToInputFile, pathToOutputFolder) => {
    const readStream = createReadStream(pathToInputFile);
    let mode = 'start';
    let metadata = '';
    const DELIMITER = /([%!?#_])/;
    let currentFile;
    for await (const chunk of readStream) {
      const str = chunk.toString();
      const strArr = str.split(DELIMITER);
      for (const entry of strArr) {
        if (entry.match(DELIMITER)) {
          if (entry === START_METADATA) {
            mode = 'metadata';
          } else if (entry === END_METADATA) {
            currentFile = await handleMetadata(metadata, pathToOutputFolder);
            metadata = '';
            mode = '';
          } else if (entry === START_CONTENT) {
            mode = 'content';
          } else if (entry === END_CONTENT) {
            mode = '';
          }
        } else {
          if (mode === 'metadata') {
            metadata += entry;
          } else if (mode === 'content') {
            await handleContent(currentFile, entry);
          }
        }
      }
    }
  };

  await processInput(pathToInputFile, pathToOutputFolder);
};
await decompressDir();
