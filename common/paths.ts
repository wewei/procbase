import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Get the procbase root directory
 */
export const getProcbaseRoot = (): string => {
  if (process.env.PROCBASE_ROOT) {
    return process.env.PROCBASE_ROOT;
  }
  return path.join(os.homedir(), '.procbase');
};

/**
 * Get the current procbase directory by resolving the __current__ symlink
 */
export const getCurrentProcbase = (): string => {
  const rootDir = getProcbaseRoot();
  const currentSymlinkPath = path.join(rootDir, '__current__');
  
  if (!fs.existsSync(currentSymlinkPath)) {
    throw new Error(`No current procbase found. Please use 'procbase use <name>' to set a current procbase.`);
  }

  try {
    const realPath = fs.realpathSync(currentSymlinkPath);
    return realPath;
  } catch (error) {
    throw new Error(`Invalid current procbase symlink. Please use 'procbase use <name>' to set a valid current procbase.`);
  }
};

/**
 * Get the current procbase name (basename of the directory)
 */
export const getCurrentProcbaseName = (): string => {
  return path.basename(getCurrentProcbase());
};

/**
 * Check if a procbase is currently selected
 */
export const hasCurrentProcbase = (): boolean => {
  const rootDir = getProcbaseRoot();
  const currentSymlinkPath = path.join(rootDir, '__current__');
  
  if (!fs.existsSync(currentSymlinkPath)) {
    return false;
  }

  try {
    fs.realpathSync(currentSymlinkPath);
    return true;
  } catch {
    return false;
  }
}; 