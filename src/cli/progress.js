const progress = () => {
  // Write your code here
  // Simulate progress bar from 0% to 100% over ~5 seconds
  // Update in place using \r every 100ms
  // Format: [████████████████████          ] 67%

  const constructProgressBarParts = (
    startTime,
    duration,
    length,
    color,
    reset,
  ) => {
    const progressStatus = Math.min((Date.now() - startTime) / duration, 1);
    const filledLength = Math.floor(progressStatus * length);
    const emptyLength = length - filledLength;
    const beginning = '[';
    const filledPart = '█'.repeat(filledLength);
    const emptyPart = ' '.repeat(emptyLength);
    const ending = `] ${(100 * progressStatus).toFixed(0)}%`;
    const conditionalNewLine = progressStatus === 1 ? '\n' : '';
    return `${beginning}${color}${filledPart}${reset}${emptyPart}${ending}${conditionalNewLine}`;
  };
};

progress();
