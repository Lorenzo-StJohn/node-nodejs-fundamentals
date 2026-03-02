import { parseArgs } from 'util';

const findByExt = async () => {
  // Write your code here
  // Recursively find all files with specific extension
  // Parse --ext CLI argument (default: .txt)
  const options = {
    ext: {
      type: 'string',
      default: 'txt',
    },
  };
  let ext;
  try {
    const { values } = parseArgs({ options });
    ext = values.ext.trim();
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. There are should be either exactly one argument named ext with its value or no arguments at all.',
    );
  }

  const FOLDER_NAME = 'workspace';
  const pathToThisFile = fileURLToPath(import.meta.url);
  const pathToThisFolder = dirname(pathToThisFile);
  const pathToRoot = join(pathToThisFolder, '..', '..');

  const getFolderPath = async (pathToRoot, pathToThisFolder, folderName) => {
    let isFolderInRoot;
    let isFolderInThisFolder;
    const pathToFolderInRoot = join(pathToRoot, folderName);
    const pathToFolderInThisFolder = join(pathToThisFolder, folderName);
    try {
      await access(pathToFolderInRoot);
      return pathToFolderInRoot;
    } catch (err) {
      isFolderInRoot = false;
    }
    try {
      await access(pathToFolderInThisFolder);
      return pathToFolderInThisFolder;
    } catch (err) {
      isFolderInThisFolder = false;
    }
    if (!isFolderInRoot && !isFolderInThisFolder) {
      throw new Error('FS operation failed');
    }
  };

  let pathToFolder;
  try {
    pathToFolder = await getFolderPath(
      pathToRoot,
      pathToThisFolder,
      FOLDER_NAME,
    );
  } catch (err) {
    console.error(err);
    console.log(
      'P. S. Folder named workspace should be either in project root folder or in src/fs folder.',
    );
    return;
  }

  const pathWithRecursion = join(pathToFolder, '**', `*.${ext}`);

  const entries = [];

  const getEntries = async (pathToFolder, pathWithRecursion) => {
    for await (const entry of glob(pathWithRecursion)) {
      const path = relative(pathToFolder, entry);
      entries.push(path);
    }
  };

  try {
    await getEntries(pathToFolder, pathWithRecursion);
  } catch (err) {
    console.error(err);
    return;
  }
};

await findByExt();
