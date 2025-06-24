import fs from 'node:fs';
import { getServerStatusFilePath, isServerRunning } from './common';

export const stopServer = () => {
  const serverState = isServerRunning();
  if (!serverState.running || !serverState.pid) {
    console.log("Server is not running.");
    // In case there are stale files
    try {
        if(fs.existsSync(getServerStatusFilePath())) {
            fs.unlinkSync(getServerStatusFilePath());
        }
    } catch(e) {}
    return;
  }

  const pid = serverState.pid;
  try {
    // process.kill is cross-platform.
    // On POSIX systems, it sends a SIGTERM signal for graceful shutdown.
    // On Windows, it terminates the process.
    process.kill(pid, 'SIGTERM');
    console.log(`Successfully stopped server with PID: ${pid}`);
  } catch (error) {
    // The process might already be gone.
    console.log(`Server with PID ${pid} was not found or could not be stopped. It may have already been terminated.`);
  } finally {
    // Always try to remove the status files
    try {
        fs.unlinkSync(getServerStatusFilePath());
    } catch(e) {}
  }
}; 