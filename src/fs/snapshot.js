import { glob, stat, access, readFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const snapshot = async () => {
  // Write your code here
  // Recursively scan workspace directory
  // Write snapshot.json with:
  // - rootPath: absolute path to workspace
  // - entries: flat array of relative paths and metadata

  const FOLDER_NAME = 'workspace';
  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const findFolder = async (pathToRoot, pathToThisFolder, folderName) => {
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
    pathToFolder = await findFolder(pathToRoot, pathToThisFolder, FOLDER_NAME);
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. Folder named workspace should be either in project root folder or in src/fs folder.',
    );
    return;
  }

  const pathWithRecursion = join(pathToFolder, '**', '*');

  const createSnapshotObj = async (pathWithRecursion) => {
    const snapshotObj = {
      rootPath: pathToFolder,
      entries: [],
    };
    for await (const entry of glob(pathWithRecursion)) {
      const entryObj = {};
      entryObj.path = relative(pathToFolder, entry);
      const entryStat = await stat(entry);
      entryObj.type = entryStat.isFile() ? 'file' : 'directory';
      if (entryObj.type === 'file') {
        entryObj.size = entryStat.size;
        const contentBuffer = await readFile(entry);
        entryObj.content = contentBuffer.toString('base64');
      }
      snapshotObj.entries.push(entryObj);
    }
    return snapshotObj;
  };

  let snapshotObj;

  try {
    snapshotObj = await createSnapshotObj(pathWithRecursion);
  } catch (err) {
    console.error(err);
    return;
  }
};

await snapshot();
