import fs from 'node:fs';
import path from 'node:path';
import { restartServer } from './server/restart';
import { isServerRunning } from './server/common';
import { getProcbaseRoot } from '../../common/paths';

export const useProcbase = (name: string) => {
  const rootDir = getProcbaseRoot();
  const procbasePath = path.join(rootDir, name);
  const currentSymlinkPath = path.join(rootDir, '__current__');

  // Check if the procbase exists
  if (!fs.existsSync(procbasePath)) {
    console.error(`Error: Procbase '${name}' does not exist at ${procbasePath}`);
    process.exit(1);
  }

  console.log(`Switching to procbase '${name}'...`);

  try {
    // Remove existing symlink if it exists
    if (fs.existsSync(currentSymlinkPath)) {
      fs.unlinkSync(currentSymlinkPath);
      console.log('Removed existing symlink.');
    }

    // Create new symlink
    fs.symlinkSync(procbasePath, currentSymlinkPath, 'dir');
    console.log(`Created symlink: ${currentSymlinkPath} -> ${procbasePath}`);

    // Restart server if it's running
    const serverState = isServerRunning();
    if (serverState.running) {
      console.log('Restarting MCP server...');
      restartServer();
    }

    console.log(`\nSuccessfully switched to procbase '${name}'.`);
    console.log(`Current procbase is now: ${name}`);

  } catch (error) {
    console.error(`\nFailed to switch to procbase '${name}'.`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}; 