import ts from 'typescript';
import type { ProjectSymbolTableState } from './createProjectSymbolTable/types';

/**
 * 项目分析结果
 */
export type ProjectAnalysisResult = {
  symbolTable: ProjectSymbolTableState;
  rootFiles: string[];
  compilerOptions: ts.CompilerOptions;
  diagnostics: ts.Diagnostic[];
  statistics: ProjectStatistics;
};

/**
 * 项目统计信息
 */
export type ProjectStatistics = {
  totalFiles: number;
  totalSymbols: number;
  exportedSymbols: number;
  internalSymbols: number;
  importCount: number;
  dependencyCount: number;
};

/**
 * 分析选项
 */
export type AnalysisOptions = {
  includeDeclarationFiles?: boolean;
  includeNodeModules?: boolean;
  includeSystemSymbols?: boolean;
  followTypeOnlyImports?: boolean;
  maxDepth?: number;
};

/**
 * 项目分析上下文
 */
export type ProjectAnalysisContext = {
  program: ts.Program;
  typeChecker: ts.TypeChecker;
  symbolTable: ProjectSymbolTableState;
  rootFiles: string[];
  compilerOptions: ts.CompilerOptions;
};

/**
 * Tree shaking 结果
 */
export type TreeShakingResult = {
  entryPoints: string[];
  includedSymbols: Set<string>;
  unusedSymbols: Set<string>;
  includedByFile: Map<string, string[]>;
  unusedByFile: Map<string, string[]>;
  symbolTable: ProjectSymbolTableState;
  statistics: TreeShakingStatistics;
};

/**
 * Tree shaking 统计信息
 */
export type TreeShakingStatistics = {
  totalSymbols: number;
  includedSymbols: number;
  unusedSymbols: number;
  removalRate: number; // 移除率百分比
};

/**
 * Tree Shaking 选项
 */
export type TreeShakingOptions = {
  includeInternalSymbols?: boolean;
  followTypeOnlyImports?: boolean;
  maxDepth?: number;
};

// Re-export ProjectSymbolTableState for convenience
export type { ProjectSymbolTableState }; 