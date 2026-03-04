import { parseArgs } from 'util';

const dynamic = async () => {
  // Write your code here
  // Accept plugin name as CLI argument
  // Dynamically import plugin from plugins/ directory
  // Call run() function and print result
  // Handle missing plugin case

  const options = {
    plugin: {
      type: 'string',
      default: [],
      multiple: true,
    },
  };

  let plugins;
  try {
    const { values } = parseArgs({ options, strict: false });
    plugins = values.plugin;
  } catch (err) {
    console.error(err);
    console.log('P. S. Reading arguments failed.');
    return;
  }
};

await dynamic();
