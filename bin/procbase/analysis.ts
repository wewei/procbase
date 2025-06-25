#!/usr/bin/env bun
import { isServerRunning, getServerStatus } from './server/common';
import { startServer } from './server/start';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import extractSymbolsFromFile from '../../functions/extractSymbols';
import type { ExtractedSymbols } from '../../types/project/ExtractedSymbols';
import type { SymbolInfo } from '../../types/project/SymbolInfo';
import { ensureServerRunning } from './server/common';

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

type SymbolCategory = 'type' | 'class' | 'interface' | 'enum' | 'function' | 'let' | 'var' | 'const';

interface AnalysisResult {
  fileName: string;
  symbols: {
    [category in SymbolCategory]: SymbolInfo[];
  };
}

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

const getSymbolCategory = (symbol: SymbolInfo): SymbolCategory => {
  const flags = symbol.kind;
  
  if (flags & ts.SymbolFlags.TypeAlias) return 'type';
  if (flags & ts.SymbolFlags.Class) return 'class';
  if (flags & ts.SymbolFlags.Interface) return 'interface';
  if (flags & ts.SymbolFlags.Enum) return 'enum';
  if (flags & ts.SymbolFlags.Function) return 'function';
  
  // For variables, we need to check the declaration type
  const declaration = symbol.declaration;
  if (ts.isVariableDeclaration(declaration)) {
    const parent = declaration.parent;
    if (ts.isVariableDeclarationList(parent)) {
      // Check if it's a const, let, or var declaration
      if (parent.flags & ts.NodeFlags.Const) return 'const';
      if (parent.flags & ts.NodeFlags.Let) return 'let';
      // Default to var if neither const nor let
      return 'var';
    }
  }
  
  // For arrow functions and other function-like declarations
  if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
    if (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) {
      return 'function';
    }
  }
  
  // Default to function if we can't determine
  return 'function';
};

const analyzeFile = (filePath: string): AnalysisResult => {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  if (!absolutePath.endsWith('.ts') && !absolutePath.endsWith('.tsx')) {
    throw new Error(`File must be a TypeScript file (.ts or .tsx): ${filePath}`);
  }
  
  // Create a simple program for single file analysis
  const program = ts.createProgram([absolutePath], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  });
  
  const sourceFile = program.getSourceFile(absolutePath);
  if (!sourceFile) {
    throw new Error(`Could not parse source file: ${filePath}`);
  }
  
  const typeChecker = program.getTypeChecker();
  const extractedSymbols = extractSymbolsFromFile(sourceFile, typeChecker);
  
  // Organize symbols by category
  const categorizedSymbols: AnalysisResult['symbols'] = {
    type: [],
    class: [],
    interface: [],
    enum: [],
    function: [],
    let: [],
    var: [],
    const: []
  };
  
  // Process exports and internal symbols
  const allSymbols = new Map([...extractedSymbols.exports, ...extractedSymbols.internal]);
  
  allSymbols.forEach((symbol) => {
    const category = getSymbolCategory(symbol);
    categorizedSymbols[category].push(symbol);
  });
  
  return {
    fileName: path.basename(absolutePath),
    symbols: categorizedSymbols
  };
};

const formatSymbol = (symbol: SymbolInfo): string => {
  const exportStatus = symbol.isExported ? 'export ' : '';
  const location = `[${symbol.sourceLocation.line}:${symbol.sourceLocation.column}]`;
  const documentation = symbol.documentation ? `\n    📝 ${symbol.documentation}` : '';
  const dependencies = symbol.dependencies && symbol.dependencies.size > 0
    ? `\n    🔗 depends on: ${Array.from(symbol.dependencies).join(', ')}`
    : '';
  
  return `  ${exportStatus}${symbol.name}: ${symbol.type} ${location}${documentation}${dependencies}`;
};

const displayAnalysis = (result: AnalysisResult): void => {
  console.log(`\n📁 Analysis of: ${result.fileName}\n`);
  
  const categories: { name: string; key: SymbolCategory }[] = [
    { name: 'Types', key: 'type' },
    { name: 'Classes', key: 'class' },
    { name: 'Interfaces', key: 'interface' },
    { name: 'Enums', key: 'enum' },
    { name: 'Functions', key: 'function' },
    { name: 'Constants', key: 'const' },
    { name: 'Let Variables', key: 'let' },
    { name: 'Var Variables', key: 'var' }
  ];
  
  categories.forEach(({ name, key }) => {
    const symbols = result.symbols[key];
    if (symbols.length > 0) {
      console.log(`\n🔹 ${name} (${symbols.length}):`);
      symbols.forEach(symbol => {
        console.log(formatSymbol(symbol));
      });
    }
  });
  
  // Summary
  const totalSymbols = Object.values(result.symbols).reduce((sum, symbols) => sum + symbols.length, 0);
  console.log(`\n📊 Summary: ${totalSymbols} top-level symbols found\n`);
};

export const analyzeFileCommand = (filePath: string): void => {
  try {
    // Ensure server is running before analysis
    ensureServerRunning();
    
    const result = analyzeFile(filePath);
    displayAnalysis(result);
  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}; 