import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createSymbolDB } from '../storage/SymbolDB';
import extractSymbolsFromFile from '../functions/extractSymbols';
import createProjectContext from '../functions/createProjectContext';
import { getCurrentProcbase } from '../common/paths';

export type CodeAnalyzer = {
  analyzeFile(filePath: string): Promise<{ success: boolean; message: string; symbols?: any }>;
  analyzeProject(projectRoot: string): Promise<{ success: boolean; message: string }>;
  getSymbols(filePath: string): any;
  getDependencies(symbolName: string): string[];
  getDependents(symbolName: string): string[];
};

const loadTsConfig = (procbaseRoot: string): ts.CompilerOptions => {
  const tsConfigPath = path.join(procbaseRoot, 'tsconfig.json');
  
  if (!fs.existsSync(tsConfigPath)) {
    // Fallback to default options if tsconfig.json doesn't exist
    return {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    };
  }

  try {
    const configFileText = fs.readFileSync(tsConfigPath, 'utf8');
    const configFile = ts.parseConfigFileTextToJson(tsConfigPath, configFileText);
    
    if (configFile.error) {
      throw new Error(`Failed to parse tsconfig.json: ${configFile.error.messageText}`);
    }

    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      procbaseRoot,
      undefined,
      tsConfigPath
    );

    if (parsedConfig.errors.length > 0) {
      console.warn('TypeScript config warnings:', parsedConfig.errors.map(e => e.messageText));
    }

    return parsedConfig.options;
  } catch (error) {
    console.warn(`Failed to load tsconfig.json from ${procbaseRoot}, using defaults:`, error);
    // Fallback to default options
    return {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    };
  }
};

export const createCodeAnalyzer = (dbPath: string): CodeAnalyzer => {
  const symbolDB = createSymbolDB(dbPath);
  
  // Initialize the database
  symbolDB.initialize();

  const analyzeFile = async (filePath: string): Promise<{ success: boolean; message: string; symbols?: any }> => {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, message: `File not found: ${filePath}` };
      }

      // Get the current procbase root and load its tsconfig.json
      const procbaseRoot = getCurrentProcbase();
      const compilerOptions = loadTsConfig(procbaseRoot);

      // Create a project context using the procbase's tsconfig.json
      const context = createProjectContext([filePath], compilerOptions);

      // Extract symbols from the file
      const sourceFile = context.program.getSourceFile(filePath);
      if (!sourceFile) {
        return { success: false, message: `Could not parse source file: ${filePath}` };
      }

      const symbols = extractSymbolsFromFile(sourceFile, context.typeChecker);
      
      // Store symbols in database
      symbolDB.addSymbols(filePath, symbols);

      return { 
        success: true, 
        message: `Successfully analyzed ${filePath}`,
        symbols: {
          exports: Array.from(symbols.exports.keys()),
          internal: Array.from(symbols.internal.keys()),
          imports: Array.from(symbols.imports.keys())
        }
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  const analyzeProject = async (projectRoot: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Get the current procbase root and load its tsconfig.json
      const procbaseRoot = getCurrentProcbase();
      const compilerOptions = loadTsConfig(procbaseRoot);

      // Find all TypeScript files in the project
      const findTsFiles = (dir: string): string[] => {
        const files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...findTsFiles(fullPath));
          } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            files.push(fullPath);
          }
        }
        
        return files;
      };

      const tsFiles = findTsFiles(projectRoot);
      
      // Analyze each file using the procbase's tsconfig.json
      for (const file of tsFiles) {
        const context = createProjectContext([file], compilerOptions);
        const sourceFile = context.program.getSourceFile(file);
        
        if (sourceFile) {
          const symbols = extractSymbolsFromFile(sourceFile, context.typeChecker);
          symbolDB.addSymbols(file, symbols);
        }
      }

      return { 
        success: true, 
        message: `Successfully analyzed ${tsFiles.length} TypeScript files` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to analyze project: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  const getSymbols = (filePath: string) => {
    return symbolDB.getSymbols(filePath);
  };

  const getDependencies = (symbolName: string): string[] => {
    return symbolDB.getDependencies(symbolName);
  };

  const getDependents = (symbolName: string): string[] => {
    return symbolDB.getDependents(symbolName);
  };

  return {
    analyzeFile,
    analyzeProject,
    getSymbols,
    getDependencies,
    getDependents
  };
}; 