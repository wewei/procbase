import ts from 'typescript';

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
  fromModule: string; // 模块路径
  isDefault: boolean; // 是否是默认导入
  originalName?: string; // 原始名称
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