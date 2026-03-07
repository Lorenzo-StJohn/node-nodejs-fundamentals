import { parentPort } from 'worker_threads';

parentPort.on('message', (data) => {
  const sortedData = data.toSorted((a, b) => a - b);
  parentPort.postMessage({ data: sortedData });
});
