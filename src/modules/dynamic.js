import { parseArgs } from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToPluginsFolder = join(pathToThisFolder, 'plugins');

  const importRunFunctions = async (plugins) => {
    const runs = [];
    for (const plugin of plugins) {
      try {
        const path = join(pathToPluginsFolder, plugin);
        const run = await import(path);
        runs.push(run);
      } catch (err) {
        try {
          const path = join(pathToPluginsFolder, plugin + '.js');
          const run = await import(path);
          runs.push(run);
        } catch (err) {
          throw new Error('Plugin not found');
        }
      }
    }
    return runs;
  };

  let runs;
  try {
    runs = await importRunFunctions(plugins);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

await dynamic();
