import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PROCBASE_ROOT = process.env.PROCBASE_ROOT || path.join(os.homedir(), '.procbase');

type ServerStatus = {
  pid: number;
  port: number;
};

export const getProcbaseDefaultRoot = (): string => {
  return PROCBASE_ROOT;
};

export const getServerStatusFilePath = (): string => {
  if (!fs.existsSync(PROCBASE_ROOT)) {
      fs.mkdirSync(PROCBASE_ROOT, { recursive: true });
  }
  return path.join(PROCBASE_ROOT, 'server-status.json');
};

export const isServerRunning = (): { running: boolean; pid: number | null } => {
  // Only use server-status.json
  const statusFile = getServerStatusFilePath();
  if (fs.existsSync(statusFile)) {
    try {
      const content = fs.readFileSync(statusFile, 'utf8');
      const status = JSON.parse(content) as ServerStatus;
      if (status.pid) {
        try {
          process.kill(status.pid, 0);
          return { running: true, pid: status.pid };
        } catch (error) {
          // Process doesn't exist, clean up stale file
          try {
            fs.unlinkSync(statusFile);
          } catch(e) {
            // ignore if already deleted
          }
        }
      }
    } catch (error) {
      // Invalid JSON, clean up
      try {
        fs.unlinkSync(statusFile);
      } catch(e) {
        // ignore if already deleted
      }
    }
  }
  return { running: false, pid: null };
}; 