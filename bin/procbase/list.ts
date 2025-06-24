import fs from 'node:fs';
import path from 'node:path';
import { getProcbaseRoot } from '../../common/paths';

const getCurrentProcbase = (rootDir: string): string | null => {
  const currentSymlinkPath = path.join(rootDir, '__current__');
  
  if (!fs.existsSync(currentSymlinkPath)) {
    return null;
  }

  try {
    const realPath = fs.realpathSync(currentSymlinkPath);
    const currentName = path.basename(realPath);
    return currentName;
  } catch {
    return null;
  }
};

export const listProcbases = () => {
  const rootDir = getProcbaseRoot();

  if (!fs.existsSync(rootDir)) {
    console.log("No procbases found. The root directory doesn't exist.");
    console.log(`(Checked path: ${rootDir})`);
    return;
  }

  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    const procbases = entries
      .filter(dirent => dirent.isDirectory() && dirent.name !== '__current__')
      .map(dirent => dirent.name);

    if (procbases.length === 0) {
      console.log("No procbases found.");
      console.log(`(Checked directory: ${rootDir})`);
    } else {
      const currentProcbase = getCurrentProcbase(rootDir);
      console.log("Available procbases:");
      procbases.forEach(name => {
        const prefix = currentProcbase === name ? "* " : "  ";
        console.log(`${prefix}${name}`);
      });
    }
  } catch (error) {
    console.error(`\nFailed to list procbases.`);
    if (error instanceof Error) {
        console.error(error.message);
    }
    process.exit(1);
  }
}; 