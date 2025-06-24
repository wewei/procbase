import { Command } from 'commander';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { createProcbase } from '../bin/procbase/create';
import { FastMCP } from 'fastmcp';
import { addType, updateType } from './tools';
import { getCurrentProcbase } from '../common/paths';

const writeServerStatus = (pid: number, port: number) => {
  const procbaseRoot = getCurrentProcbase();
  const statusFile = path.join(path.dirname(procbaseRoot), 'server-status.json');
  const status = { pid, port };
  try {
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write server-status.json file:', err);
  }
};

const program = new Command();

program
  .option('-p, --port <number>', 'Port for the MCP server', '8192')
  .parse(process.argv);

const options = program.opts();
const port = parseInt(options.port, 10);

// Get the current procbase directory
let root: string;
try {
  root = getCurrentProcbase();
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}

// Per fastmcp convention, run the server from within the root directory.
process.chdir(root);
console.log(`Changed working directory to: ${root}`);

const server = new FastMCP({
    name: path.basename(root),
    version: '1.0.0',
});

// TODO: Add MCP tools for type management
// - add_type: Add a new type to the procbase
// - update_type: Update an existing type
// - search_types: Search for types (literal and semantic)

server.start({
  transportType: "httpStream",
  httpStream: {
    port: port,
  },
});

// Write server status after successful start
writeServerStatus(process.pid, port);

console.log(`MCP Server is running on port ${port}`);
console.log(`Serving procbase from: ${root}`); 