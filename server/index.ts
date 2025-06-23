import { Command } from 'commander';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { createProcbase } from '../bin/procbase/create';
import { FastMCP } from 'fastmcp';

const program = new Command();

program
  .option('-p, --port <number>', 'Port for the MCP server', '8192')
  .option('-r, --root <path>', 'Root directory for the procbase', path.join(os.homedir(), '.procbase', 'default'))
  .parse(process.argv);

const options = program.opts();
const port = parseInt(options.port, 10);
const root = options.root;

// Ensure the root procbase directory exists
if (!fs.existsSync(root)) {
  console.log(`Procbase root at '${root}' does not exist. Creating it...`);
  const procbaseName = path.basename(root);
  // Temporarily set PROCBASE_ROOT to the parent directory of the intended root
  process.env.PROCBASE_ROOT = path.dirname(root);
  createProcbase(procbaseName);
  // Unset the temporary environment variable
  delete process.env.PROCBASE_ROOT;
}

// Per fastmcp convention, run the server from within the root directory.
process.chdir(root);
console.log(`Changed working directory to: ${root}`);

const server = new FastMCP({
    name: path.basename(root),
    version: '1.0.0',
});

server.start({
  transportType: "httpStream",
  httpStream: {
    port: port,
  },
});

console.log(`MCP Server is running on port ${port}`);
console.log(`Serving procbase from: ${root}`); 