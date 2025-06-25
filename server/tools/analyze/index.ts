import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import extractSymbolsFromFile from '../../../functions/extractSymbols';
import type { SymbolInfo } from '../../../types/project/SymbolInfo';

type SymbolCategory = 'type' | 'class' | 'interface' | 'enum' | 'function' | 'let' | 'var' | 'const';

interface AnalysisResult {
  fileName: string;
  symbols: {
    [category in SymbolCategory]: SymbolInfo[];
  };
}

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

const displayAnalysis = (result: AnalysisResult): string => {
  let output = `\n📁 Analysis of: ${result.fileName}\n`;
  
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
      output += `\n🔹 ${name} (${symbols.length}):`;
      symbols.forEach(symbol => {
        output += `\n${formatSymbol(symbol)}`;
      });
    }
  });
  
  // Summary
  const totalSymbols = Object.values(result.symbols).reduce((sum, symbols) => sum + symbols.length, 0);
  output += `\n\n📊 Summary: ${totalSymbols} top-level symbols found\n`;
  
  return output;
};

const createSerializableAnalysis = (result: AnalysisResult) => {
  const serializableSymbols: any = {};
  
  Object.entries(result.symbols).forEach(([category, symbols]) => {
    serializableSymbols[category] = symbols.map(symbol => ({
      name: symbol.name,
      type: symbol.type,
      isExported: symbol.isExported,
      sourceLocation: symbol.sourceLocation,
      documentation: symbol.documentation,
      dependencies: symbol.dependencies ? Array.from(symbol.dependencies) : [],
      kind: symbol.kind
    }));
  });
  
  return {
    fileName: result.fileName,
    symbols: serializableSymbols
  };
};

export const analyzeTool = {
  analyzeFile,
  displayAnalysis,
  createSerializableAnalysis
}; 