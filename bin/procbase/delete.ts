import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const getProcbaseRoot = (): string => {
  if (process.env.PROCBASE_ROOT) {
    return process.env.PROCBASE_ROOT;
  }
  return path.join(os.homedir(), '.procbase');
};

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

export const deleteProcbase = (name: string) => {
  const rootDir = getProcbaseRoot();
  const procbasePath = path.join(rootDir, name);

  if (!fs.existsSync(procbasePath)) {
    console.error(`Error: Procbase '${name}' does not exist at ${procbasePath}`);
    process.exit(1);
  }

  try {
    // Check if this is the current procbase
    const currentProcbase = getCurrentProcbase(rootDir);
    const isCurrent = currentProcbase === name;

    if (isCurrent) {
      console.log(`Warning: Deleting the current procbase '${name}'.`);
      console.log('Removing current symlink...');
      
      const currentSymlinkPath = path.join(rootDir, '__current__');
      if (fs.existsSync(currentSymlinkPath)) {
        fs.unlinkSync(currentSymlinkPath);
        console.log('Current symlink removed.');
      }
    }

    console.log(`Deleting procbase '${name}' from ${procbasePath}...`);
    fs.rmSync(procbasePath, { recursive: true, force: true });
    console.log(`Successfully deleted procbase '${name}'.`);
    
    if (isCurrent) {
      console.log('No procbase is currently active.');
    }
  } catch (error) {
    console.error(`\nFailed to delete procbase '${name}'.`);
    if (error instanceof Error) {
        console.error(error.message);
    }
    process.exit(1);
  }
}; 