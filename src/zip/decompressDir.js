import { access, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream, createReadStream } from 'fs';
import { Buffer } from 'buffer';
import { createBrotliDecompress } from 'zlib';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';
import { Readable, Writable } from 'stream';
import { PassThrough } from 'node:stream';

const decompressDir = async () => {
  // Folder workspace should be either in project root folder or in src/zip
  // Folder compressed with archive.br inside it should be inside workspace folder

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

  const handleMetadata = async (metadata, pathToOutputFolder) => {
    const metadataObj = JSON.parse(metadata);
    const path = join(pathToOutputFolder, metadataObj.path);
    if (metadataObj.type === 'directory') {
      await mkdir(path);
    }
    return [path, size];
  };

  const processInput = async (pathToInputFile, pathToOutputFolder) => {
    const readStream = createReadStream(pathToInputFile);
    const decompress = createBrotliDecompress();
    readStream.pipe(decompress);
    let buffer = Buffer.alloc(0);
    let currentFile;
    let currentMetaSize;
    let needMeta;
    let needContent;
    let needMetaSize = 4;
    let metadata = Buffer.alloc(0);
    let mode = 'metadata-size';
    for await (const chunk of decompress) {
      buffer = Buffer.concat([buffer, chunk]);
      if (mode === 'metadata-size') {
        if (buffer.length >= needMetaSize) {
          metadata = Buffer.concat([metadata, buffer.slice(0, needMetaSize)]);
          buffer = buffer.slice(needMetaSize, buffer.length);
          currentMetaSize = metadata.readUInt32BE(0);
          metadata = Buffer.alloc(0);
          mode = 'metadata';
          needMetaSize = 4;
          needMeta = currentMetaSize;
          console.log(currentMetaSize);
        } else {
          needMetaSize -= buffer.length;
          metadata = Buffer.concat([metadata, buffer]);
          buffer = Buffer.alloc(0);
        }
      }
    }
  };

  await processInput(pathToInputFile, pathToOutputFolder);
};
await decompressDir();
