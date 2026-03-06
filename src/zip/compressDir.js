import { stat, access } from 'fs/promises';
import { Transform } from 'stream';
import { createBrotliCompress } from 'zlib';
import { join, dirname } from 'path';
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
      [zlib.constants.BROTLI_PARAM_QUALITY]: COMPRESS_LEVEL,
    },
  });

  const createCompressTransform = (compressor) => {
    return new Transform({
      transform(chunk, encoding, callback) {
        callback(null, compressor(chunk));
      },
    });
  };

  const createMetadata = async (entry) => {
    const entryStat = await stat(entry);
    const entryType = entryStat.isFile ? 'file' : 'directory';
    const entryObj = {
      path: entry,
      type: entryType,
    };
    return JSON.stringify(entryObj);
  };
};

await compressDir();
