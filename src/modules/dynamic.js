import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const dynamic = async () => {
  // Write your code here
  // Accept plugin name as CLI argument
  // Dynamically import plugin from plugins/ directory
  // Call run() function and print result
  // Handle missing plugin case

  const plugins = process.argv.slice(2);

  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToPluginsFolder = join(pathToThisFolder, 'plugins');

  const importRunFunctions = async (plugins) => {
    const importedObjs = [];
    for (const plugin of plugins) {
      try {
        const path = join(pathToPluginsFolder, plugin);
        const importedObj = await import(path);
        importedObjs.push(importedObj);
      } catch (err) {
        try {
          const path = join(pathToPluginsFolder, plugin + '.js');
          const importedObj = await import(path);
          importedObjs.push(importedObj);
        } catch (err) {
          throw new Error('Plugin not found');
        }
      }
    }
    return importedObjs;
  };

  let importedObjs;
  try {
    importedObjs = await importRunFunctions(plugins);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  const executeImportedFunctions = (importedObjs) => {
    for (const importedObj of importedObjs) {
      if (
        importedObj &&
        'run' in importedObj &&
        typeof importedObj.run === 'function'
      ) {
        const result = importedObj.run();
        console.log(result);
      } else {
        console.log('No run function');
      }
    }
  };
  executeImportedFunctions(importedObjs);
};

await dynamic();
