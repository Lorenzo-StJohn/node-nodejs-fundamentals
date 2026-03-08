import { access, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWriteStream, createReadStream } from 'node:fs';
import { Buffer } from 'node:buffer';
import { createBrotliDecompress } from 'node:zlib';

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
    let metadataSize = Buffer.alloc(0);
    let metadata = Buffer.alloc(0);
    let mode = 'metadata-size';
    let isContinueLoop = true;
    let writeStream;
    for await (const chunk of decompress) {
      decompress.pause();
      buffer = Buffer.concat([buffer, chunk]);
      while (isContinueLoop) {
        if (mode === 'metadata-size') {
          if (buffer.length >= needMetaSize) {
            metadataSize = Buffer.concat([
              metadataSize,
              buffer.slice(0, needMetaSize),
            ]);
            buffer = buffer.slice(needMetaSize, buffer.length);
            currentMetaSize = metadataSize.readUInt32BE(0);
            metadataSize = Buffer.alloc(0);
            mode = 'metadata';
            needMetaSize = 4;
            needMeta = currentMetaSize;
          } else {
            needMetaSize -= buffer.length;
            metadataSize = Buffer.concat([metadataSize, buffer]);
            buffer = Buffer.alloc(0);
          }
        } else if (mode === 'metadata') {
          if (buffer.length >= needMeta) {
            metadata = Buffer.concat([metadata, buffer.slice(0, needMeta)]);
            buffer = buffer.slice(needMeta, buffer.length);
            currentFile = JSON.parse(metadata.toString());
            metadata = Buffer.alloc(0);
            if (currentFile.type === 'file') {
              mode = 'content';
              needContent = currentFile.fileSize;
              writeStream = createWriteStream(
                join(pathToOutputFolder, currentFile.path),
              );
            } else {
              await mkdir(join(pathToOutputFolder, currentFile.path));
              mode = 'metadata-size';
            }
          } else {
            needMeta -= buffer.length;
            metadata = Buffer.concat([metadata, buffer]);
            buffer = Buffer.alloc(0);
          }
        } else {
          if (buffer.length >= needContent) {
            writeStream.write(buffer.slice(0, needContent));
            await new Promise((resolve, reject) => {
              writeStream.on('finish', resolve);
              writeStream.on('error', reject);
              writeStream.end();
            });
            buffer = buffer.slice(needContent, buffer.length);
            mode = 'metadata-size';
          } else {
            needContent -= buffer.length;
            writeStream.write(buffer);
            buffer = Buffer.alloc(0);
          }
        }
        if (buffer.length === 0) {
          isContinueLoop = false;
        }
      }
      decompress.resume();
      isContinueLoop = true;
    }
  };

  await processInput(pathToInputFile, pathToOutputFolder);
};
await decompressDir();
