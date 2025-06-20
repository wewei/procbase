// Main function exports
export { default as analyzeProject } from './analyzeProject';
export { default as createProjectContext, fromConfig, fromFiles, createDefaultOptions } from './createProjectContext';
export { default as performTreeShaking } from './performTreeShaking';
export { default as extractSymbolsFromFile } from './extractSymbols';

// Type exports
export * from './types';
export { default as createProjectSymbolTable } from './createProjectSymbolTable/index';
export { default as addFileSymbols } from './createProjectSymbolTable/addFileSymbols';
export { default as getSymbol } from './createProjectSymbolTable/getSymbol';
export { default as getAllSymbols } from './createProjectSymbolTable/getAllSymbols';
export { default as getDependencies } from './createProjectSymbolTable/getDependencies';
export { default as getDependents } from './createProjectSymbolTable/getDependents';
export { default as calculateClosure } from './createProjectSymbolTable/calculateClosure';
export { default as calculateReverseClosure } from './createProjectSymbolTable/calculateReverseClosure';
export { default as findUnusedSymbols } from './createProjectSymbolTable/findUnusedSymbols';
export { default as getFileSymbols } from './createProjectSymbolTable/getFileSymbols';
export { default as getAllFiles } from './createProjectSymbolTable/getAllFiles'; 