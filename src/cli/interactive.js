import { uptime } from 'process';
import { createInterface } from 'readline/promises';

const interactive = () => {
  // Write your code here
  // Use readline module for interactive CLI
  // Support commands: uptime, cwd, date, exit
  // Handle Ctrl+C and unknown commands
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const onUptime = async () => {};
  const onCwd = async () => {};
  const onDate = async () => {};
  const onExit = async () => {};

  const printPrompt = async () => {
    const userInput = await rl.question('>');
    switch (userInput) {
      case 'uptime': {
        void onUptime();
        break;
      }
      case 'cwd': {
        void onCwd();
        break;
      }
      case 'date': {
        void onDate();
        break;
      }
      case 'exit': {
        void onExit();
        break;
      }
      default: {
        console.log('Unknown command');
        void printPrompt();
      }
    }
  };

  void printPrompt();
};

interactive();
