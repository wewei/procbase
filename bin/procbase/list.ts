import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const getProcbaseRoot = (): string => {
  if (process.env.PROCBASE_ROOT) {
    return process.env.PROCBASE_ROOT;
  }
  return path.join(os.homedir(), '.procbase');
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
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (procbases.length === 0) {
      console.log("No procbases found.");
      console.log(`(Checked directory: ${rootDir})`);
    } else {
      console.log("Available procbases:");
      procbases.forEach(name => console.log(`  - ${name}`));
    }
  } catch (error) {
    console.error(`\nFailed to list procbases.`);
    if (error instanceof Error) {
        console.error(error.message);
    }
    process.exit(1);
  }
}; 