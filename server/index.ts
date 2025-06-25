import { Command } from 'commander';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { createProcbase } from '../bin/procbase/create';
import { FastMCP } from 'fastmcp';
import { analyzeTool } from './tools/analyze';
import { addTypeTool } from './tools/add-type';
import { updateTypeTool } from './tools/update-type';
import { getCurrentProcbase } from '../common/paths';
import { createServer } from 'node:http';
import { URL } from 'node:url';

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
// - analyze_file: Analyze a TypeScript file

server.start({
  transportType: "httpStream",
  httpStream: {
    port: port,
  },
});

// Create a simple HTTP server for analysis requests
const httpServer = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://localhost:${port}`);
  const pathname = url.pathname;

  console.log(`[HTTP] ${req.method} ${pathname} - ${new Date().toISOString()}`);

  if (pathname === '/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body) {
          console.log('[HTTP] Error: Empty request body');
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Request body is required'
          }));
          return;
        }

        const requestData = JSON.parse(body);
        const { filePath } = requestData;

        if (!filePath) {
          console.log('[HTTP] Error: Missing filePath in request');
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'filePath is required in request body'
          }));
          return;
        }

        console.log(`[HTTP] Analyzing file: ${filePath}`);
        const result = analyzeTool.analyzeFile(filePath);
        const formattedOutput = analyzeTool.displayAnalysis(result);
        
        console.log(`[HTTP] Analysis completed successfully for: ${filePath}`);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          formattedOutput
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[HTTP] Analysis error: ${errorMessage}`);
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: errorMessage,
          details: error instanceof Error ? error.stack : undefined
        }));
      }
    });
  } else if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      procbase: root
    }));
  } else {
    console.log(`[HTTP] 404: ${req.method} ${pathname}`);
    res.writeHead(404);
    res.end(JSON.stringify({ 
      error: 'Not found',
      availableEndpoints: ['/analyze', '/health']
    }));
  }
});

httpServer.listen(port + 1, () => {
  console.log(`HTTP Analysis Server is running on port ${port + 1}`);
}).on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Failed to start HTTP Analysis Server. Port ${port + 1} is in use.`);
    console.error('Try stopping any existing servers or use a different port.');
    process.exit(1);
  } else {
    console.error(`❌ Failed to start HTTP Analysis Server: ${error.message}`);
    process.exit(1);
  }
});

// Write server status after successful start
writeServerStatus(process.pid, port);

console.log(`MCP Server is running on port ${port}`);
console.log(`HTTP Analysis Server is running on port ${port + 1}`);
console.log(`Serving procbase from: ${root}`);
console.log(`Health check available at: http://localhost:${port + 1}/health`); 