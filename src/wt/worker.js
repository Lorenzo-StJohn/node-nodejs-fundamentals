import { parentPort } from 'node:worker_threads';

parentPort.on('message', (data) => {
  const sortedData = data.toSorted((a, b) => a - b);
  parentPort.postMessage({ array: sortedData });
});
