#!/usr/bin/env bun
import { isServerRunning, getServerStatus } from './server/common';
import { startServer } from './server/start';
import fs from 'node:fs';
import path from 'node:path';

type AnalysisResponse = {
  success: boolean;
  analysis?: any;
  formattedOutput?: string;
  error?: string;
  details?: string;
};

type HealthResponse = {
  status: string;
  timestamp: string;
  procbase: string;
};

const ensureServerRunning = (): number => {
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

const validateFilePath = (filePath: string): string => {
  // Resolve relative paths
  const absolutePath = path.resolve(filePath);
  
  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Check if it's a TypeScript file
  if (!absolutePath.endsWith('.ts') && !absolutePath.endsWith('.tsx')) {
    throw new Error(`File must be a TypeScript file (.ts or .tsx): ${filePath}`);
  }
  
  return absolutePath;
};

const checkServerHealth = async (analysisPort: number): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:${analysisPort}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const health = await response.json() as HealthResponse;
      console.log(`✅ Server health check passed - serving procbase: ${health.procbase}`);
      return true;
    }
  } catch (error) {
    console.log(`⚠️  Server health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  return false;
};

const analyzeFileViaServer = async (filePath: string): Promise<void> => {
  try {
    // Validate the file path first
    const absolutePath = validateFilePath(filePath);
    console.log(`📁 Analyzing file: ${absolutePath}`);
    
    // Ensure server is running
    const port = ensureServerRunning();
    const analysisPort = port + 1;
    
    // Check server health
    const isHealthy = await checkServerHealth(analysisPort);
    if (!isHealthy) {
      console.log('⚠️  Server health check failed, but continuing with analysis...');
    }
    
    console.log(`📡 Sending analysis request to server...`);
    const response = await fetch(`http://localhost:${analysisPort}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath: absolutePath }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(`Server error (${response.status}): ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json() as AnalysisResponse;

    if (result.success) {
      console.log(result.formattedOutput);
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Analysis failed:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to analyze file:', error instanceof Error ? error.message : String(error));
    console.error('');
    console.error('Troubleshooting tips:');
    console.error('1. Make sure the file exists and is a TypeScript file (.ts or .tsx)');
    console.error('2. Check that the server is running: procbase status');
    console.error('3. Try restarting the server: procbase restart');
    console.error('4. Check server logs for more details');
    process.exit(1);
  }
};

export const analyzeFileCommand = (filePath: string): void => {
  analyzeFileViaServer(filePath);
}; 