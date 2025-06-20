import type ts from 'typescript';

export type SymbolExtractionOptions = {
  includeNodeModules: boolean;
  includeSystemSymbols: boolean;
};

export type SymbolInfo = {
  name: string;
  kind: ts.SymbolFlags;
  type: string;
  declaration: ts.Declaration;
  isExported: boolean;
  documentation?: string;
  sourceLocation: SourceLocation;
  fileName: string;
  dependencies: Set<string>;
  dependents: Set<string>;
};

export type ImportInfo = {
  name: string;
  fromModule: string;
  isDefault: boolean;
  originalName?: string;
};

export type SourceLocation = {
  start: number;
  end: number;
  line: number;
  column: number;
};

export type ExtractedSymbols = {
  exports: Map<string, SymbolInfo>;
  internal: Map<string, SymbolInfo>;
  imports: Map<string, ImportInfo>;
}; 