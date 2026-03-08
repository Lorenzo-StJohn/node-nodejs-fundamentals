import { cpus } from 'node:os';
import { access, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

const main = async () => {
  // The data.json should be either in project folder or in src/wt

  const n = cpus().length;

  const JSON_NAME = 'data.json';
  const WORKER_FILE_NAME = 'worker.js';
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

  const workersArray = [];

  const pathToWorker = join(pathToThisFolder, WORKER_FILE_NAME);

  const workersResults = new Array(n);

  for (let i = 0; i < n; i += 1) {
    workersArray.push(
      new Promise((resolve, reject) => {
        const worker = new Worker(pathToWorker);
        worker.postMessage(arraySplitted[i]);
        worker.on('message', (data) => {
          workersResults[i] = data.array;
          resolve(data);
          worker.terminate();
        });
        worker.on('error', (err) => {
          reject(err);
        });
        worker.on('exit', (code) => {
          reject(`Worker have exited with ${code} code.`);
        });
      }),
    );
  }

  class MinBinaryHeap {
    constructor() {
      this.array = [];
    }

    getMinElement() {
      const minElement = this.array[0];
      this.heapify();
      return minElement;
    }

    heapify() {
      this.array[0] = this.array.pop();
      let currentIndex = 0;
      while (
        (currentIndex * 2 + 1 < this.array.length &&
          this.array[currentIndex].value >
            this.array[currentIndex * 2 + 1].value) ||
        (currentIndex * 2 + 2 < this.array.length &&
          this.array[currentIndex].value >
            this.array[currentIndex * 2 + 2].value)
      ) {
        if (
          currentIndex * 2 + 2 < this.array.length &&
          this.array[currentIndex * 2 + 2].value <
            this.array[currentIndex * 2 + 1].value
        ) {
          const temp = this.array[currentIndex * 2 + 2];
          this.array[currentIndex * 2 + 2] = this.array[currentIndex];
          this.array[currentIndex] = temp;
          currentIndex = currentIndex * 2 + 2;
        } else {
          const temp = this.array[currentIndex * 2 + 1];
          this.array[currentIndex * 2 + 1] = this.array[currentIndex];
          this.array[currentIndex] = temp;
          currentIndex = currentIndex * 2 + 1;
        }
      }
    }

    addNewElement(element) {
      let currentIndex = this.array.length;
      this.array.push(element);
      while (
        currentIndex > 0 &&
        this.array[Math.floor((currentIndex - 1) / 2)].value > element.value
      ) {
        this.array[currentIndex] =
          this.array[Math.floor((currentIndex - 1) / 2)];
        this.array[Math.floor((currentIndex - 1) / 2)] = element;
        currentIndex = Math.floor((currentIndex - 1) / 2);
      }
      const arr = this.array.map((el) => el.value);
    }
  }

  try {
    await Promise.all(workersArray);

    const workersPointers = new Array(n).fill(0);

    const result = new Array(array.length);

    const heap = new MinBinaryHeap();

    for (let j = 0; j < n; j += 1) {
      if (workersPointers[j] < workersResults[j].length) {
        heap.addNewElement({
          value: workersResults[j][workersPointers[j]],
          source: j,
        });
        ++workersPointers[j];
      }
    }

    for (let i = 0; i < array.length; i += 1) {
      const currentElement = heap.getMinElement();
      result[i] = currentElement.value;
      if (
        workersPointers[currentElement.source] <
        workersResults[currentElement.source].length
      ) {
        heap.addNewElement({
          value:
            workersResults[currentElement.source][
              workersPointers[currentElement.source]
            ],
          source: currentElement.source,
        });
        ++workersPointers[currentElement.source];
      }
    }
    console.log(result);
  } catch (err) {
    console.error(err);
  }
};

await main();
