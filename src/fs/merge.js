import { access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const merge = async () => {
  // The workspace directory should be either in project folder or in src/fs

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
};

await merge();
