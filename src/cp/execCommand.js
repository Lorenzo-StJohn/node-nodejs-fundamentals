import { spawn } from 'node:child_process';

const execCommand = () => {
  //Example: node src/cp/execCommand.js "ls -la"
  //P. S. Don't forget quotes around "ls -la"

  const wholeArgs = process.argv[2];
  const argsArray = wholeArgs.split(' ');
  const cmdArg = argsArray[0];
  const otherArgs = argsArray.slice(1);

  const child = spawn(cmdArg, otherArgs, {
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  process.stdin.pipe(child.stdin);

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
};

execCommand();
