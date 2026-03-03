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

  const onUptime = () => {
    console.log(`Uptime: ${process.uptime().toFixed(2)}s`);
    void printPrompt();
  };

  const onCwd = () => {
    console.log(`Current working directory: ${process.cwd()}`);
    void printPrompt();
  };

  const onDate = () => {
    console.log(
      `Current date and time in ISO format (UTC): ${new Date().toISOString()}`,
    );
    void printPrompt();
  };

  const onExit = async () => {};

  const printPrompt = async () => {
    const command = await rl.question('>');
    switch (command) {
      case 'uptime': {
        onUptime();
        break;
      }
      case 'cwd': {
        onCwd();
        break;
      }
      case 'date': {
        onDate();
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
