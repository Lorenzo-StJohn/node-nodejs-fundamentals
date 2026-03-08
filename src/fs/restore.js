import { access, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const restore = async () => {
  // The snapshot.json should be either in project folder or in src/fs

  const JSON_NAME = 'snapshot.json';
  const FOLDER_NAME = 'workspace_restored';
  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const getFilePath = async (pathToRoot, pathToThisFolder, fileName) => {
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
    pathToJsonFile = await getFilePath(pathToRoot, pathToThisFolder, JSON_NAME);
  } catch (err) {
    console.log(
      'P. S. File named snapshot.json should be either in project root folder or in src/fs folder.',
    );
    throw err;
  }

  const readJsonFile = async (pathToJsonFile) => {
    const data = await readFile(pathToJsonFile, { encoding: 'utf8' });
    return JSON.parse(data);
  };

  let snapshotObj;
  try {
    snapshotObj = await readJsonFile(pathToJsonFile);
  } catch (err) {
    console.error(err);
    return;
  }

  const pathToFolder = join(dirname(pathToJsonFile), FOLDER_NAME);

  const createFolder = async (pathToFolder) => {
    try {
      await mkdir(pathToFolder);
    } catch (err) {
      if (err.code === 'EEXIST') {
        throw new Error('FS operation failed');
      } else {
        throw err;
      }
    }
  };

  try {
    await createFolder(pathToFolder);
  } catch (err) {
    if (err.message === 'FS operation failed') {
      console.log('P. S. Directory workspace_restored already exists.');
      throw err;
    }
    console.error(err);
    return;
  }

  const writeContentToFolder = async (pathToFolder, obj) => {
    for await (const entry of obj.entries) {
      const path = join(pathToFolder, entry.path);
      if (entry.type === 'directory') {
        await mkdir(path, { recursive: true });
      } else {
        const contentBuffer = Buffer.from(entry.content, 'base64');
        await writeFile(path, contentBuffer);
      }
    }
  };

  await writeContentToFolder(pathToFolder, snapshotObj);
};

await restore();
