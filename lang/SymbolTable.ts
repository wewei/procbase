import * as ts from 'typescript';

/**
 * 符号信息
 */
export type SymbolInfo = {
  name: string;
  kind: ts.SymbolFlags;
  type: string;
  declaration: ts.Declaration;
  isExported: boolean;
  documentation?: string;
  sourceLocation: SourceLocation;
  fileName: string;
  // 符号的依赖项
  dependencies: Set<string>;
  // 依赖于此符号的其他符号
  dependents: Set<string>;
};

/**
 * 导入信息
 */
export type ImportInfo = {
  name: string; // 本地名称
  moduleSpecifier: string; // 模块路径
  importType: 'default' | 'named' | 'namespace';
  originalName: string; // 原始名称
  fileName: string;
};

/**
 * 源码位置信息
 */
export type SourceLocation = {
  start: number;
  end: number;
  line: number;
  column: number;
};

/**
 * 提取的符号集合
 */
export type ExtractedSymbols = {
  exports: Map<string, SymbolInfo>;
  internal: Map<string, SymbolInfo>;
  imports: Map<string, ImportInfo>;
};

/**
 * 文件级别的符号信息
 */
export type FileSymbols = {
  fileName: string;
  symbols: ExtractedSymbols;
};

/**
 * 项目符号表状态
 */
export type ProjectSymbolTableState = {
  fileSymbols: Map<string, FileSymbols>;
  globalSymbols: Map<string, SymbolInfo>;
  dependencies: Map<string, Set<string>>;
  reverseDependencies: Map<string, Set<string>>;
};

/**
 * 创建新的项目符号表
 * @returns 初始化的项目符号表状态
 */
export const createProjectSymbolTable = (): ProjectSymbolTableState => ({
  fileSymbols: new Map(),
  globalSymbols: new Map(),
  dependencies: new Map(),
  reverseDependencies: new Map()
});

/**
 * 添加文件符号到符号表
 * @param symbolTable - 符号表状态
 * @param fileSymbols - 文件符号信息
 * @returns 更新后的符号表状态
 */
export const addFileSymbols = (
  symbolTable: ProjectSymbolTableState,
  fileSymbols: FileSymbols
): ProjectSymbolTableState => {
  symbolTable.fileSymbols.set(fileSymbols.fileName, fileSymbols);
  
  // 添加到全局符号表
  Array.from(fileSymbols.symbols.exports.values()).concat(Array.from(fileSymbols.symbols.internal.values()))
    .forEach(symbol => {
      const fullName = `${fileSymbols.fileName}:${symbol.name}`;
      symbolTable.globalSymbols.set(fullName, symbol);
      
      // 建立依赖关系
      symbolTable.dependencies.set(fullName, symbol.dependencies);
      symbol.dependencies.forEach((dep: string) => {
        if (!symbolTable.reverseDependencies.has(dep)) {
          symbolTable.reverseDependencies.set(dep, new Set());
        }
        symbolTable.reverseDependencies.get(dep)!.add(fullName);
      });
    });
  
  return symbolTable;
};

/**
 * 获取符号信息
 * @param symbolTable - 符号表状态
 * @param symbolName - 符号名称
 * @returns 符号信息或undefined
 */
export const getSymbol = (
  symbolTable: ProjectSymbolTableState,
  symbolName: string
): SymbolInfo | undefined => {
  return symbolTable.globalSymbols.get(symbolName);
};

/**
 * 获取所有符号
 * @param symbolTable - 符号表状态
 * @returns 所有符号的映射
 */
export const getAllSymbols = (symbolTable: ProjectSymbolTableState): Map<string, SymbolInfo> => {
  return symbolTable.globalSymbols;
};

/**
 * 获取符号的直接依赖
 * @param symbolTable - 符号表状态
 * @param symbolName - 符号名称
 * @returns 依赖符号集合
 */
export const getDependencies = (
  symbolTable: ProjectSymbolTableState,
  symbolName: string
): Set<string> => {
  return symbolTable.dependencies.get(symbolName) || new Set();
};

/**
 * 获取依赖于某个符号的符号
 * @param symbolTable - 符号表状态
 * @param symbolName - 符号名称
 * @returns 依赖者符号集合
 */
export const getDependents = (
  symbolTable: ProjectSymbolTableState,
  symbolName: string
): Set<string> => {
  return symbolTable.reverseDependencies.get(symbolName) || new Set();
};

/**
 * 计算符号闭包 - 给定根符号，计算所有需要包含的符号
 * @param symbolTable - 符号表状态
 * @param rootSymbols - 根符号列表
 * @returns 符号闭包集合
 */
export const calculateClosure = (
  symbolTable: ProjectSymbolTableState,
  rootSymbols: string[]
): Set<string> => {
  const closure = new Set<string>();
  const visited = new Set<string>();
  const queue = [...rootSymbols];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (visited.has(current)) {
      continue;
    }
    
    visited.add(current);
    closure.add(current);

    // 添加所有依赖到队列
    const deps = getDependencies(symbolTable, current);
    deps.forEach(dep => {
      if (!visited.has(dep)) {
        queue.push(dep);
      }
    });
  }

  return closure;
};

/**
 * 计算反向闭包 - 给定符号，计算所有依赖它的符号
 * @param symbolTable - 符号表状态
 * @param targetSymbols - 目标符号列表
 * @returns 反向闭包集合
 */
export const calculateReverseClosure = (
  symbolTable: ProjectSymbolTableState,
  targetSymbols: string[]
): Set<string> => {
  const closure = new Set<string>();
  const visited = new Set<string>();
  const queue = [...targetSymbols];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (visited.has(current)) {
      continue;
    }
    
    visited.add(current);
    closure.add(current);

    // 添加所有依赖者到队列
    const dependents = getDependents(symbolTable, current);
    dependents.forEach(dependent => {
      if (!visited.has(dependent)) {
        queue.push(dependent);
      }
    });
  }

  return closure;
};

/**
 * 查找未使用的符号
 * @param symbolTable - 符号表状态
 * @param exportedSymbols - 导出的符号列表
 * @returns 未使用的符号集合
 */
export const findUnusedSymbols = (
  symbolTable: ProjectSymbolTableState,
  exportedSymbols: string[]
): Set<string> => {
  const usedSymbols = calculateClosure(symbolTable, exportedSymbols);
  const allSymbols = new Set(symbolTable.globalSymbols.keys());
  
  const unusedSymbols = new Set<string>();
  allSymbols.forEach(symbol => {
    if (!usedSymbols.has(symbol)) {
      unusedSymbols.add(symbol);
    }
  });
  
  return unusedSymbols;
};

/**
 * 获取文件中的所有符号
 * @param symbolTable - 符号表状态
 * @param fileName - 文件名
 * @returns 文件符号信息或undefined
 */
export const getFileSymbols = (
  symbolTable: ProjectSymbolTableState,
  fileName: string
): FileSymbols | undefined => {
  return symbolTable.fileSymbols.get(fileName);
};

/**
 * 获取所有文件
 * @param symbolTable - 符号表状态
 * @returns 所有文件名列表
 */
export const getAllFiles = (symbolTable: ProjectSymbolTableState): string[] => {
  return Array.from(symbolTable.fileSymbols.keys());
};
