import fs from 'node:fs';
import path from 'node:path';
import { getProcbaseRoot } from '../../../common/paths';
import { startServer } from './start';

type ServerStatus = {
  pid: number;
  port: number;
};

export const getProcbaseDefaultRoot = (): string => {
  return getProcbaseRoot();
};

export const getServerStatusFilePath = (): string => {
  const rootDir = getProcbaseRoot();
  if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir, { recursive: true });
  }
  return path.join(rootDir, 'server-status.json');
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

export const getServerStatus = (): ServerStatus | null => {
  const statusFile = getServerStatusFilePath();
  if (fs.existsSync(statusFile)) {
    try {
      const content = fs.readFileSync(statusFile, 'utf8');
      return JSON.parse(content) as ServerStatus;
    } catch (error) {
      return null;
    }
  }
  return null;
};

/**
 * Ensures the MCP server is running, starting it if necessary
 * @returns The port number the server is running on
 */
export const ensureServerRunning = (): number => {
  const serverState = isServerRunning();
  if (!serverState.running) {
    console.log('🚀 Starting MCP server...');
    startServer();
    // Wait a moment for server to start
    console.log('⏳ Waiting for server to start...');
    Bun.sleepSync(2000);
  }
  
  const status = getServerStatus();
  const port = status?.port || 8192;
  console.log(`✅ Server is running on port ${port}`);
  return port;
}; 