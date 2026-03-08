import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const verify = async () => {
  // File checksums.json should be either in project folder or in src/hash
  // Listed in checksums.json files should be in workspace folder
  // The workspace folder should be either in project folder or in src/hash

  const JSON_NAME = 'checksums.json';
  const FOLDER_NAME = 'workspace';

  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const calculateHash = async (path, algorithm) => {
    const hash = createHash(algorithm);
    const stream = createReadStream(path);
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    return hash.digest('hex');
  };

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
    console.error(err);
    console.log(
      'P. S. File named checksums.json should be either in project root folder or in src/hash folder.',
    );
    return;
  }

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
      return pathToThisFolder;
    }
  };

  const pathToFolder = await getFolderPath(
    pathToRoot,
    pathToThisFolder,
    FOLDER_NAME,
  );

  const readJsonFile = async (pathToJsonFile) => {
    const data = await readFile(pathToJsonFile, { encoding: 'utf8' });
    return JSON.parse(data);
  };

  let hashesFromJson;
  try {
    hashesFromJson = await readJsonFile(pathToJsonFile);
  } catch (err) {
    console.error(err);
    return;
  }

  const checkEquality = async (hashesFromJson, pathToFolder) => {
    for (const filename in hashesFromJson) {
      const path = join(pathToFolder, filename);
      let actualHash;
      try {
        actualHash = await calculateHash(path, 'sha256');
      } catch (err) {
        actualHash = '';
      }
      console.log(
        `${filename} — ${hashesFromJson[filename] === actualHash ? 'OK' : 'FAIL'}`,
      );
    }
  };

  await checkEquality(hashesFromJson, pathToFolder);
};

await verify();
