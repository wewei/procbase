import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const getProcbaseDefaultRoot = (): string => {
  return path.join(os.homedir(), '.procbase');
};

export const getPidFilePath = (): string => {
  const procbaseRoot = getProcbaseDefaultRoot();
  if (!fs.existsSync(procbaseRoot)) {
      fs.mkdirSync(procbaseRoot, { recursive: true });
  }
  return path.join(procbaseRoot, 'server.pid');
};

export const isServerRunning = (): { running: boolean; pid: number | null } => {
  const pidPath = getPidFilePath();
  if (!fs.existsSync(pidPath)) {
    return { running: false, pid: null };
  }

  const pidStr = fs.readFileSync(pidPath, 'utf8').trim();
  const pid = parseInt(pidStr, 10);
  
  if (isNaN(pid)) {
    fs.unlinkSync(pidPath);
    return { running: false, pid: null };
  }

  try {
    // On Unix, process.kill with signal 0 tests if the process exists.
    // On Windows, it will throw an error if the process does not exist, and do nothing if it does.
    process.kill(pid, 0);
    return { running: true, pid };
  } catch (error) {
    // If the process does not exist, an error is thrown. We can safely assume
    // the server is not running and clean up the stale PID file.
    try {
        fs.unlinkSync(pidPath);
    } catch(e) {
        // ignore if already deleted
    }
    return { running: false, pid: null };
  }
}; 