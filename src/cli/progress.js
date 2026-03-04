const progress = () => {
  const COLOR_RESET = '\x1b[0m';
  const DEFAULT_DURATION = 5000;
  const DEFAULT_INTERVAL = 100;
  const DEFAULT_LENGTH = 30;
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

  const getArgs = () => {
    const args = process.argv;
    const argObj = {};
    let currentFlag = null;

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.startsWith('--')) {
          currentFlag = arg.substring(2);
        } else {
          currentFlag = null;
        }
      } else if (currentFlag) {
        argObj[currentFlag] = arg;
      }
    }
    return argObj;
  };

  const args = getArgs();
  const durationRaw = parseInt(args.duration) ?? DEFAULT_DURATION;
  const duration =
    isNaN(durationRaw) || durationRaw < 0 ? DEFAULT_DURATION : durationRaw;
  const intervalRaw = parseInt(args.interval) ?? DEFAULT_INTERVAL;
  const interval =
    isNaN(intervalRaw) || intervalRaw < 1 ? DEFAULT_INTERVAL : intervalRaw;
  const lengthRaw = parseInt(args.length) ?? DEFAULT_LENGTH;
  const length = isNaN(lengthRaw) || lengthRaw < 0 ? DEFAULT_LENGTH : lengthRaw;
  const colorRaw = args.color ?? DEFAULT_COLOR;
  const color = hexToAnsi(colorRaw);

  const startTime = Date.now();

  const intervalId = setInterval(() => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(
      constructProgressBarParts(
        startTime,
        duration,
        length,
        color,
        COLOR_RESET,
        intervalId,
      ),
    );
  }, interval);
};

progress();
