import { stat, access, readFile, writeFile, readdir } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const snapshot = async () => {
  // The workspace directory should be either in project folder or in src/fs

  const FOLDER_NAME = 'workspace';
  const JSON_NAME = 'snapshot.json';
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

  const readRecursively = async (
    pathToCurrentFolder,
    pathToFolder,
    snapshotObj,
  ) => {
    const entries = await readdir(pathToCurrentFolder);
    for (const entryWithoutFolder of entries) {
      const entry = join(pathToCurrentFolder, entryWithoutFolder);
      const entryObj = {};
      entryObj.path = relative(pathToFolder, entry);
      const entryStat = await stat(entry);
      entryObj.type = entryStat.isFile() ? 'file' : 'directory';
      if (entryObj.type === 'file') {
        entryObj.size = entryStat.size;
        const contentBuffer = await readFile(entry);
        entryObj.content = contentBuffer.toString('base64');
        snapshotObj.entries.push(entryObj);
      } else {
        snapshotObj.entries.push(entryObj);
        await readRecursively(entry, pathToFolder, snapshotObj);
      }
    }
  };

  const snapshotObj = {
    rootPath: pathToFolder,
    entries: [],
  };

  try {
    await readRecursively(pathToFolder, pathToFolder, snapshotObj);
  } catch (err) {
    console.error(err);
    return;
  }

  const writeJsonFile = async (path, obj) => {
    await writeFile(path, JSON.stringify(obj));
  };

  try {
    const path = join(dirname(pathToFolder), JSON_NAME);
    await writeJsonFile(path, snapshotObj);
  } catch (err) {
    console.error(err);
    return;
  }
};

await snapshot();
