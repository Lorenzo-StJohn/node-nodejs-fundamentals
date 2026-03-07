import { cpus } from 'os';
import { access, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const main = async () => {
  // Write your code here
  // Read data.json containing array of numbers
  // Split into N chunks (N = CPU cores)
  // Create N workers, send one chunk to each
  // Collect sorted chunks
  // Merge using k-way merge algorithm
  // Log final sorted array

  // The data.json should be either in project folder or in src/wt

  const n = cpus().length;

  const JSON_NAME = 'data.json';
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
    console.error(err);
    console.log(
      'P. S. File named data.json should be either in project root folder or in src/wt folder.',
    );
    return;
  }

  const readJsonFile = async (pathToJsonFile) => {
    const data = await readFile(pathToJsonFile, { encoding: 'utf8' });
    return JSON.parse(data);
  };

  let array;
  try {
    array = await readJsonFile(pathToJsonFile);
  } catch (err) {
    console.error(err);
    return;
  }

  const arraySplitted = [];
  let alreadySplittedCounter = 0;
  for (let i = 0; i < n; i += 1) {
    const numberToNewArray = Math.ceil(
      (array.length - alreadySplittedCounter) / (n - i),
    );
    arraySplitted.push(
      array.slice(
        alreadySplittedCounter,
        alreadySplittedCounter + numberToNewArray,
      ),
    );
    alreadySplittedCounter += numberToNewArray;
  }
};

await main();
