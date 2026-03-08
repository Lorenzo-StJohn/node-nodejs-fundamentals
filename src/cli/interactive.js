import { createInterface } from 'node:readline/promises';

const interactive = () => {
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

  const onExit = () => {
    rl.close();
  };

  const printPrompt = async () => {
    const commandRAW = await rl.question('>');
    const command = commandRAW.trim().toLowerCase();
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
        onExit();
        break;
      }
      default: {
        console.log('Unknown command');
        void printPrompt();
      }
    }
  };

  const handleClosing = () => {
    console.log('Goodbye');
    process.exit(0);
  };

  rl.on('close', handleClosing);

  rl.on('SIGINT', () => {
    rl.close();
  });

  void printPrompt();
};

interactive();
