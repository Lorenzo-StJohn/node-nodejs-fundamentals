import { stat, access, readdir, rm, mkdir } from 'fs/promises';
import { Readable, Transform } from 'stream';
import { createBrotliCompress, constants } from 'zlib';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

const compressDir = async () => {
  // Folder workspace should be either in project root folder or in src/zip
  // Folder toCompress should be inside workspace folder

  const COMPRESS_LEVEL = 4;
  const FOLDER_PATHS = ['workspace', 'toCompress'];
  const OUTPUT_FILE_PATHS = ['compressed', 'archive.br'];
  const START_METADATA = '?';
  const END_METADATA = '!';
  const START_CONTENT = '_';
  const END_CONTENT = '#';

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

  const handleContent = async (
    entry,
    compressorParams,
    pathToOutputFile,
    START_CONTENT,
    END_CONTENT,
  ) => {
    await pipeline(
      Readable.from(START_CONTENT),
      createWriteStream(pathToOutputFile, { flags: 'a' }),
    );
    await pipeline(
      createReadStream(entry),
      createBrotliCompress({
        params: compressorParams,
      }),
      new Transform({
        transform(chunk, encoding, callback) {
          callback(null, chunk.toString('base64'));
        },
      }),
      createWriteStream(pathToOutputFile, { flags: 'a' }),
    );
    await pipeline(
      Readable.from(END_CONTENT),
      createWriteStream(pathToOutputFile, { flags: 'a' }),
    );
  };

  const handleMetadata = async (
    metadataJson,
    compressorParams,
    pathToOutputFile,
    START_METADATA,
    END_METADATA,
  ) => {
    await pipeline(
      Readable.from(START_METADATA),
      createWriteStream(pathToOutputFile, { flags: 'a' }),
    );
    await pipeline(
      Readable.from(metadataJson),
      createBrotliCompress({
        params: compressorParams,
      }),
      new Transform({
        transform(chunk, encoding, callback) {
          callback(null, chunk.toString('base64'));
        },
      }),
      createWriteStream(pathToOutputFile, { flags: 'a' }),
    );
    await pipeline(
      Readable.from(END_METADATA),
      createWriteStream(pathToOutputFile, { flags: 'a' }),
    );
  };

  const readRecursively = async (
    pathToCurrentFolder,
    pathToFolder,
    compressorParams,
    pathToOutputFile,
    START_METADATA,
    END_METADATA,
    START_CONTENT,
    END_CONTENT,
  ) => {
    const entries = await readdir(pathToCurrentFolder);
    for (const entryWithoutFolder of entries) {
      const entry = join(pathToCurrentFolder, entryWithoutFolder);
      const metadataJson = await createMetadata(entry, pathToFolder);
      const metadataObj = JSON.parse(metadataJson);
      await handleMetadata(
        metadataJson,
        compressorParams,
        pathToOutputFile,
        START_METADATA,
        END_METADATA,
      );
      if (metadataObj.type === 'file') {
        await handleContent(
          entry,
          compressorParams,
          pathToOutputFile,
          START_CONTENT,
          END_CONTENT,
        );
      } else {
        await readRecursively(
          entry,
          pathToFolder,
          compressorParams,
          pathToOutputFile,
          START_METADATA,
          END_METADATA,
          START_CONTENT,
          END_CONTENT,
        );
      }
    }
  };

  try {
    await readRecursively(
      pathToFolder,
      pathToFolder,
      compressorParams,
      pathToOutputFile,
      START_METADATA,
      END_METADATA,
      START_CONTENT,
      END_CONTENT,
    );
  } catch (err) {
    console.error(err);
    return;
  }
};

await compressDir();
