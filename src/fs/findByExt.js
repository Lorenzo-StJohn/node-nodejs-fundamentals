import { parseArgs } from 'node:util';
import { access, stat, readdir } from 'node:fs/promises';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    const { values } = parseArgs({ options, strict: false });
    ext = values.ext.trim();
  } catch (err) {
    console.error(err);
    console.log('P. S. Reading arguments failed.');
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

  const entries = [];

  const readRecursively = async (
    pathToCurrentFolder,
    pathToFolder,
    array,
    ext,
  ) => {
    const entries = await readdir(pathToCurrentFolder);
    for (const entryWithoutFolder of entries) {
      const entry = join(pathToCurrentFolder, entryWithoutFolder);
      const path = relative(pathToFolder, entry);
      const entryStat = await stat(entry);
      if (entryStat.isFile()) {
        if (extname(entry) === `.${ext}`) {
          array.push(path);
        }
      } else {
        await readRecursively(entry, pathToFolder, array, ext);
      }
    }
  };

  try {
    await readRecursively(pathToFolder, pathToFolder, entries, ext);
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
