import { parseArgs } from 'node:util';

const progress = () => {
  // If you want to use color flag, be aware that some shells treat # symbol as comment starting,
  // so you may need to quote color argument, for example:
  // node src / cli / progress--interval 100 --color '#66aaee' --duration 6000 --length 50
  // Alternatively you can temporary disable treating it as comment in bash shell with this command:
  // shopt - u interactive_comments

  const COLOR_RESET = '\x1b[0m';
  const DEFAULT_DURATION = '5000';
  const DEFAULT_INTERVAL = '100';
  const DEFAULT_LENGTH = '30';
  const DEFAULT_COLOR = '';

  const constructProgressBarParts = (
    startTime,
    duration,
    length,
    color,
    reset,
    intervalId,
  ) => {
    const progressStatus = Math.min((Date.now() - startTime) / duration, 1);
    if (progressStatus === 1) clearInterval(intervalId);
    const filledLength = Math.floor(progressStatus * length);
    const emptyLength = length - filledLength;
    const beginning = '[';
    const filledPart = '█'.repeat(filledLength);
    const emptyPart = ' '.repeat(emptyLength);
    const ending = `] ${(100 * progressStatus).toFixed(0)}%`;
    const conditionalDone = progressStatus === 1 ? '\nDone!\n' : '';
    return `${beginning}${color}${filledPart}${reset}${emptyPart}${ending}${conditionalDone}`;
  };

  const hexToAnsi = (hex) => {
    if (hex.length < 7) return '';
    if (hex[0] !== '#') return '';
    const rr = parseInt(hex.slice(1, 3), 16);
    if (isNaN(rr) || rr < 0 || rr > 255) return '';
    const gg = parseInt(hex.slice(3, 5), 16);
    if (isNaN(gg) || gg < 0 || gg > 255) return '';
    const bb = parseInt(hex.slice(5, 7), 16);
    if (isNaN(bb) || bb < 0 || bb > 255) return '';
    const prefix = '\x1b[38;2;';
    return `${prefix}${rr};${gg};${bb}m`;
  };

  const options = {
    duration: {
      type: 'string',
      default: DEFAULT_DURATION,
    },
    interval: {
      type: 'string',
      default: DEFAULT_INTERVAL,
    },
    length: {
      type: 'string',
      default: DEFAULT_LENGTH,
    },
    color: {
      type: 'string',
      default: DEFAULT_COLOR,
    },
  };
  let durationResolved, intervalResolved, lengthResolved, colorResolved;
  try {
    const { values } = parseArgs({ options, strict: false });
    const { duration, interval, length, color } = values;
    const durationInt = parseInt(duration);
    durationResolved =
      isNaN(durationInt) || durationInt < 0 ? +DEFAULT_DURATION : durationInt;
    const intervalInt = parseInt(interval);
    intervalResolved =
      isNaN(intervalInt) || intervalInt < 1 ? +DEFAULT_INTERVAL : intervalInt;
    const lengthInt = parseInt(length);
    lengthResolved =
      isNaN(lengthInt) || lengthInt < 0 ? +DEFAULT_LENGTH : lengthInt;
    colorResolved = hexToAnsi(color);
  } catch (err) {
    console.error(err);
    console.log('P. S. Reading arguments failed.');
    return;
  }

  const startTime = Date.now();

  const intervalId = setInterval(() => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(
      constructProgressBarParts(
        startTime,
        durationResolved,
        lengthResolved,
        colorResolved,
        COLOR_RESET,
        intervalId,
      ),
    );
  }, intervalResolved);
};

progress();
