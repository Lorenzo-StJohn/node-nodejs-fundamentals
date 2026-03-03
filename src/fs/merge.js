import { access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const merge = async () => {
  // The workspace directory should be either in project folder or in src/fs

  const FOLDER_NAME = 'workspace';
  const PARTS_FOLDER_NAME = 'parts';
  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const getFolderPath = async (
    pathToRoot,
    pathToThisFolder,
    folderName,
    partsName,
  ) => {
    let isFolderInRoot;
    let isFolderInThisFolder;
    const pathToFolderInRoot = join(pathToRoot, folderName, partsName);
    const pathToFolderInThisFolder = join(
      pathToThisFolder,
      folderName,
      partsName,
    );
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
  let pathToFolderWithParts;
  try {
    pathToFolderWithParts = await getFolderPath(
      pathToRoot,
      pathToThisFolder,
      FOLDER_NAME,
      PARTS_FOLDER_NAME,
    );
    pathToFolder = dirname(pathToFolderWithParts);
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. Folder named workspace with folder named parts in it should be either in project root folder or in src/fs folder.',
    );
    return;
  }

  const getNamedArgs = (argName) => {
    const args = process.argv;
    let isArgProvided = false;
    const argArray = [];
    let currentFlag = null;

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.startsWith('--')) {
          currentFlag = arg.substring(2);
          if (currentFlag === argName) {
            isArgProvided = true;
          }
        } else {
          currentFlag = null;
        }
      } else if (currentFlag === argName) {
        argArray.push(arg);
      }
    }
    return [isArgProvided, argArray];
  };

  const [isFilesProvided, files] = getNamedArgs('files');
};

await merge();
