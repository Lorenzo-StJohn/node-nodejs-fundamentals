import { access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const restore = async () => {
  // The snapshot.json should be either in project folder or in src/fs

  const JSON_NAME = 'snapshot.json';
  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const findFile = async (pathToRoot, pathToThisFolder, fileName) => {
    let isFileInRoot;
    let isFileInThisFolder;
    const pathToFileInRoot = join(pathToRoot, fileName);
    const pathToFileInThisFolder = join(pathToThisFolder, fileName);
    try {
      await access(pathToFileInRoot);
      return pathToFileInRoot;
    } catch (err) {
      isFileInRoot = false;
    }
    try {
      await access(pathToFileInThisFolder);
      return pathToFileInThisFolder;
    } catch (err) {
      isFileInThisFolder = false;
    }
    if (!isFileInRoot && !isFileInThisFolder) {
      throw new Error('FS operation failed');
    }
  };

  let pathToJsonFile;
  try {
    pathToJsonFile = await findFile(pathToRoot, pathToThisFolder, JSON_NAME);
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. File named snapshot.json should be either in project root folder or in src/fs folder.',
    );
    return;
  }
};

await restore();
