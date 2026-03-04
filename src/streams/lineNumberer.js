import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

const lineNumberer = () => {
  // Write your code here
  // Read from process.stdin
  // Use Transform Stream to prepend line numbers
  // Write to process.stdout

  const lineNumberTransform = new Transform();

  const handlePipeline = async (...items) => {
    try {
      await pipeline(...items);
    } catch (err) {
      console.error(err);
      return;
    }
  };

  void handlePipeline(process.stdin, lineNumberTransform, process.stdout);
};

lineNumberer();
