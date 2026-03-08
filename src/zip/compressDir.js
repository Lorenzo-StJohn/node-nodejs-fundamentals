import { stat, access, readdir, rm, mkdir } from 'node:fs/promises';
import { PassThrough } from 'node:stream';
import { createBrotliCompress, constants } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWriteStream, createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Buffer } from 'node:buffer';

const compressDir = async () => {
  // Folder workspace should be either in project root folder or in src/zip
  // Folder toCompress should be inside workspace folder

  const COMPRESS_LEVEL = 4;
  const FOLDER_PATHS = ['workspace', 'toCompress'];
  const OUTPUT_FILE_PATHS = ['compressed', 'archive.br'];

  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const getFolderPath = async (pathToRoot, pathToThisFolder, folderPaths) => {
    let isFolderInRoot;
    let isFolderInThisFolder;
    const pathToFolderInRoot = join(pathToRoot, ...folderPaths);
    const pathToFolderInThisFolder = join(pathToThisFolder, ...folderPaths);
    try {
      await access(pathToFolderInRoot);
      return pathToFolderInRoot;
    } catch (err) {
      isFolderInRoot = false;
    }
    try {
      await access(pathToFolderInThisFolder);
      return pathToFolderInThisFolder;
    } catch (err) {
      isFolderInThisFolder = false;
    }
    if (!isFolderInRoot && !isFolderInThisFolder) {
      throw new Error('FS operation failed');
    }
  };

  let pathToFolder;
  try {
    pathToFolder = await getFolderPath(
      pathToRoot,
      pathToThisFolder,
      FOLDER_PATHS,
    );
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. Folder named workspace with folder named toCompress should be either in project root folder or in src/zip.',
    );
    return;
  }

  const pathToOutputFolder = join(
    pathToFolder,
    '..',
    ...OUTPUT_FILE_PATHS.slice(0, -1),
  );

  const createFolder = async (path) => {
    try {
      await rm(path, { force: true, recursive: true });
      await mkdir(path, { recursive: true });
    } catch (err) {
      throw new Error('Attempt to create/recreate compressed folder failed');
    }
  };

  try {
    await createFolder(pathToOutputFolder);
  } catch (err) {
    console.error(err);
    return;
  }

  const pathToOutputFile = join(pathToOutputFolder, OUTPUT_FILE_PATHS.at(-1));

  const compressorParams = {
    [constants.BROTLI_PARAM_QUALITY]: COMPRESS_LEVEL,
  };

  const createMetadata = async (entry, pathToFolder) => {
    const entryStat = await stat(entry);
    const entryType = entryStat.isFile() ? 'file' : 'directory';
    const path = relative(pathToFolder, entry);
    const entryObj = {
      path: path,
      type: entryType,
    };
    if (entryType === 'file') entryObj.fileSize = entryStat.size;
    return JSON.stringify(entryObj);
  };

  const createBufferWithMetadataSize = (metadataSize) => {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(metadataSize, 0);
    return buffer;
  };

  const createBufferWithMetadata = (metadata) => {
    return Buffer.from(metadata, 'utf8');
  };

  const globalStream = new PassThrough();

  const pipelinePromise = pipeline(
    globalStream,
    createBrotliCompress({ params: compressorParams }),
    createWriteStream(pathToOutputFile),
  ).catch((err) => {
    console.error(err);
  });

  let isSuccess;

  const readRecursively = async (pathToCurrentFolder, pathToFolder) => {
    const entries = await readdir(pathToCurrentFolder);
    for (const entryWithoutFolder of entries) {
      const entry = join(pathToCurrentFolder, entryWithoutFolder);
      const metadataJson = await createMetadata(entry, pathToFolder);
      const metadataSize = Buffer.byteLength(metadataJson, 'utf8');
      const metadataObj = JSON.parse(metadataJson);
      const bufferWithMetadataSize = createBufferWithMetadataSize(metadataSize);
      isSuccess = globalStream.write(bufferWithMetadataSize);
      if (!isSuccess) {
        await new Promise((resolve) => globalStream.once('drain', resolve));
      }
      const bufferWithMetadata = createBufferWithMetadata(metadataJson);
      isSuccess = globalStream.write(bufferWithMetadata);
      if (!isSuccess) {
        await new Promise((resolve) => globalStream.once('drain', resolve));
      }
      if (metadataObj.type === 'file') {
        const readStream = createReadStream(entry);
        for await (const chunk of readStream) {
          isSuccess = globalStream.write(chunk);
          if (!isSuccess) {
            await new Promise((resolve) => globalStream.once('drain', resolve));
          }
        }
      } else {
        await readRecursively(entry, pathToFolder);
      }
    }
  };

  try {
    await readRecursively(pathToFolder, pathToFolder);
    globalStream.end();
    await pipelinePromise;
  } catch (err) {
    globalStream.destroy(err);
    console.error(err);
  }
};

await compressDir();
