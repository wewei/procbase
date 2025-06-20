import type { ProjectSymbolTableState } from './types';

/**
 * 创建新的项目符号表
 * @returns 初始化的项目符号表状态
 */
const createProjectSymbolTable = (): ProjectSymbolTableState => ({
  fileSymbols: new Map(),
  globalSymbols: new Map(),
  dependencies: new Map(),
  reverseDependencies: new Map()
});

export default createProjectSymbolTable;

export type { SymbolInfo } from './types/SymbolInfo';
export type { ImportInfo } from './types/ImportInfo';
export type { SourceLocation } from './types/SourceLocation';
export type { ExtractedSymbols } from './types/ExtractedSymbols';
export type { FileSymbols } from './types/FileSymbols';
export type { ProjectSymbolTableState } from './types/ProjectSymbolTableState';
export type { SymbolExtractionOptions } from '../extractSymbols/types/SymbolExtractionOptions'; 