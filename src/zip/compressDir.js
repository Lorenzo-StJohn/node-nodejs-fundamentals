import { stat } from 'fs/promises';
import { Transform } from 'stream';

const compressDir = async () => {
  // Write your code here
  // Read all files from workspace/toCompress/
  // Compress entire directory structure into archive.br
  // Save to workspace/compressed/
  // Use Streams API

  const stringTransform = new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk.toString('base64'));
    },
  });

  const createMetadata = async (entry) => {
    const entryStat = await stat(entry);
    const entryType = entryStat.isFile ? 'file' : 'directory';
    const entryObj = {
      path: entry,
      type: entryType,
    };
    return JSON.stringify(entryObj);
  };
};

await compressDir();
