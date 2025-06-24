import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createSymbolDB } from '../storage/SymbolDB';
import extractSymbolsFromFile from '../functions/extractSymbols';
import createProjectContext from '../functions/createProjectContext';

export type CodeAnalyzer = {
  analyzeFile(filePath: string): Promise<{ success: boolean; message: string; symbols?: any }>;
  analyzeProject(projectRoot: string): Promise<{ success: boolean; message: string }>;
  getSymbols(filePath: string): any;
  getDependencies(symbolName: string): string[];
  getDependents(symbolName: string): string[];
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

      // Create a simple project context for single file analysis
      const projectRoot = path.dirname(filePath);
      const context = createProjectContext(
        [filePath],
        {
          target: ts.ScriptTarget.ESNext,
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        }
      );

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
      
      // Analyze each file
      for (const file of tsFiles) {
        await analyzeFile(file);
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