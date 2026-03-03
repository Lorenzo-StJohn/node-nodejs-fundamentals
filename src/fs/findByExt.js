import { parseArgs } from 'util';
import { glob, access, stat } from 'fs/promises';
import { join, dirname, relative, extname } from 'path';
import { fileURLToPath } from 'url';

const findByExt = async () => {
  // The workspace directory should be either in project folder or in src/fs

  const options = {
    ext: {
      type: 'string',
      default: 'txt',
    },
  };
  let ext;
  try {
    const { values } = parseArgs({ options });
    ext = values.ext.trim();
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. There are should be either exactly one argument named ext with its value or no arguments at all.',
    );
    return;
  }

  const FOLDER_NAME = 'workspace';
  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const getFolderPath = async (pathToRoot, pathToThisFolder, folderName) => {
    let isFolderInRoot;
    let isFolderInThisFolder;
    const pathToFolderInRoot = join(pathToRoot, folderName);
    const pathToFolderInThisFolder = join(pathToThisFolder, folderName);
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
      FOLDER_NAME,
    );
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. Folder named workspace should be either in project root folder or in src/fs folder.',
    );
    return;
  }

  if (ext[0] === '.') {
    ext = ext.substring(1);
  }
  const pathWithRecursion = join(pathToFolder, '**', `*.${ext}`);

  const entries = [];

  const getEntries = async (pathToFolder, pathWithRecursion, ext) => {
    for await (const entry of glob(pathWithRecursion)) {
      const path = relative(pathToFolder, entry);
      const entryStat = await stat(entry);
      if (entryStat.isFile() && extname(path) === `.${ext}`) {
        entries.push(path);
      }
    }
  };

  try {
    await getEntries(pathToFolder, pathWithRecursion, ext);
  } catch (err) {
    console.error(err);
    return;
  }

  const printArrayAlphabetically = (arr) => {
    const sortedArray = arr.toSorted((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
    sortedArray.forEach((entry) => console.log(entry));
  };

  printArrayAlphabetically(entries);
};

await findByExt();
