import { isServerRunning } from './server/common';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PROCBASE_ROOT = process.env.PROCBASE_ROOT || path.join(os.homedir(), '.procbase');

type ServerStatus = {
  pid: number;
  port: number;
};

const getServerStatus = (): ServerStatus | null => {
  const statusFile = path.join(PROCBASE_ROOT, 'server-status.json');
  if (fs.existsSync(statusFile)) {
    try {
      const content = fs.readFileSync(statusFile, 'utf8');
      const status = JSON.parse(content) as ServerStatus;
      if (status.pid && status.port) {
        return status;
      }
    } catch (err) {
      console.error('Failed to parse server-status.json:', err);
    }
  }
  return null;
};

export const showServerStatus = () => {
  const status = isServerRunning();
  const serverStatus = getServerStatus();
  
  if (status.running) {
    const port = serverStatus?.port || 8192;
    console.log(`MCP server is running (PID: ${status.pid}, Port: ${port})`);
  } else {
    const port = serverStatus?.port || 8192;
    console.log(`MCP server is not running. Last known port: ${port}`);
  }
}; 