import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const verify = async () => {
  // File checksums.json should be either in project folder or in src/hash
  // Calculate SHA256 hash using Streams API
  // Print result: filename — OK/FAIL

  const JSON_NAME = 'checksums.json';

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
};

await verify();
