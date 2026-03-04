import { createHash } from 'crypto';
import { createReadStream } from 'fs';

const verify = async () => {
  // Write your code here
  // Read checksums.json
  // Calculate SHA256 hash using Streams API
  // Print result: filename — OK/FAIL

  const calculateHash = async (path, algorithm) => {
    const hash = createHash(algorithm);
    const stream = createReadStream(path);
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    return hash.digest('hex');
  };
};

await verify();
