import { stat, access, readdir, rm, mkdir } from 'fs/promises';
import { Transform } from 'stream';
import { createBrotliCompress, constants, brotliCompress } from 'zlib';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { promisify } from 'util';

const compressDir = async () => {
  // Folder workspace should be either in project root folder or in src/zip
  // Folder toCompress should be inside workspace folder

  const COMPRESS_LEVEL = 4;
  const FOLDER_PATHS = ['workspace', 'toCompress'];
  const OUTPUT_FILE_PATHS = ['compressed', 'archive.br'];
  const START_METADATA = '?';
  const END_METADATA = '!';

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
  const writeStream = createWriteStream(pathToOutputFile);

  const stringTransform = new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk.toString('base64'));
    },
  });

  const compressorParams = {
    [constants.BROTLI_PARAM_QUALITY]: COMPRESS_LEVEL,
  };

  const compressStream = createBrotliCompress({
    params: compressorParams,
  });

  const compress = promisify(brotliCompress);

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

  const handleFile = async (
    metadataJson,
    entry,
    writeStream,
    compress,
    compressStream,
    stringTransform,
  ) => {
    await writeStream.write(START_METADATA);
    const metadataCompressed = await compress(metadataJson);
    const metadataStr = metadataCompressed.toString('base64');
    await writeStream.write(metadataStr);
    await writeStream.write(END_METADATA);
  };

  const handleFolder = async (
    metadataJson,
    writeStream,
    compress,
    compressStream,
    stringTransform,
  ) => {
    await writeStream.write(START_METADATA);
    const metadataCompressed = await compress(metadataJson);
    const metadataStr = metadataCompressed.toString('base64');
    await writeStream.write(metadataStr);
    await writeStream.write(END_METADATA);
  };

  const readRecursively = async (
    pathToCurrentFolder,
    pathToFolder,
    writeStream,
    compress,
    compressStream,
    stringTransform,
  ) => {
    const entries = await readdir(pathToCurrentFolder);
    for (const entryWithoutFolder of entries) {
      const entry = join(pathToCurrentFolder, entryWithoutFolder);
      const metadataJson = await createMetadata(entry, pathToFolder);
      const metadataObj = JSON.parse(metadataJson);
      if (metadataObj.type === 'file') {
        await handleFile(
          metadataJson,
          entry,
          writeStream,
          compress,
          compressStream,
          stringTransform,
        );
      } else {
        await handleFolder(
          metadataJson,
          writeStream,
          compress,
          compressStream,
          stringTransform,
        );
        await readRecursively(
          entry,
          pathToFolder,
          writeStream,
          compress,
          compressStream,
          stringTransform,
        );
      }
    }
  };

  try {
    await readRecursively(
      pathToFolder,
      pathToFolder,
      writeStream,
      compress,
      compressStream,
      stringTransform,
    );
  } catch (err) {
    console.error(err);
    return;
  }
};

await compressDir();
