import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getPidFilePath, isServerRunning } from './common';

export const startServer = () => {
  const serverState = isServerRunning();
  if (serverState.running) {
    console.log(`Server is already running with PID: ${serverState.pid}`);
    return;
  }

  // The server script is at <project_root>/server/index.ts
  const serverScriptPath = path.resolve(__dirname, '../../../server/index.ts');

  if (!fs.existsSync(serverScriptPath)) {
      console.error(`Server script not found at: ${serverScriptPath}`);
      process.exit(1);
  }

  const child = spawn('bun', [serverScriptPath], {
    detached: true,
    stdio: 'ignore',
  });
  
  child.unref();

  if (child.pid) {
    fs.writeFileSync(getPidFilePath(), child.pid.toString());
    console.log(`Server started successfully with PID: ${child.pid}`);
  } else {
    console.error("Failed to start server: Could not get PID.");
    process.exit(1);
  }
}; 