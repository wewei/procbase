import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

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
    const command = `tasklist /FI "PID eq ${pid}"`;
    const output = execSync(command).toString();

    if (output.includes(pid.toString())) {
      return { running: true, pid };
    } else {
      fs.unlinkSync(pidPath);
      return { running: false, pid: null };
    }
  } catch (error) {
    try {
        fs.unlinkSync(pidPath);
    } catch(e) {
        // ignore if already deleted
    }
    return { running: false, pid: null };
  }
}; 