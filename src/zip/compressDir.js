import { stat, access, readFile, readdir } from 'fs/promises';
import { Transform } from 'stream';
import { createBrotliCompress, constants } from 'zlib';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const compressDir = async () => {
  // Folder workspace should be either in project root folder or in src/zip
  // Folder toCompress should be inside workspace folder

  const COMPRESS_LEVEL = 4;
  const FOLDER_PATHS = ['workspace', 'toCompress'];

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

  const stringTransform = new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk.toString('base64'));
    },
  });

  const compressor = createBrotliCompress({
    params: {
      [constants.BROTLI_PARAM_QUALITY]: COMPRESS_LEVEL,
    },
  });

  const createCompressTransform = (compressor) => {
    return new Transform({
      transform(chunk, encoding, callback) {
        callback(null, compressor(chunk));
      },
    });
  };

  const createMetadata = async (entry, pathToFolder) => {
    const entryStat = await stat(entry);
    const entryType = entryStat.isFile() ? 'file' : 'directory';
    const path = relative(pathToFolder, entry);
    const entryObj = {
      path: path,
      type: entryType,
    };
    return JSON.stringify(entryObj);
  };

  const handleFile = async (metadataJson, entry) => {};

  const handleFolder = async (metadataJson) => {};

  const readRecursively = async (pathToCurrentFolder, pathToFolder) => {
    const entries = await readdir(pathToCurrentFolder);
    for (const entryWithoutFolder of entries) {
      const entry = join(pathToCurrentFolder, entryWithoutFolder);
      const metadataJson = await createMetadata(entry, pathToFolder);
      const metadataObj = JSON.parse(metadataJson);
      if (metadataObj.type === 'file') {
        await handleFile(metadataJson, entry);
      } else {
        await handleFolder(metadataJson);
        await readRecursively(entry, pathToFolder);
      }
    }
  };

  await readRecursively(pathToFolder, pathToFolder);
};

await compressDir();
