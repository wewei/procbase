import ts from 'typescript';
import type { ExtractedSymbols } from '../types/project/ExtractedSymbols';
import type { SymbolInfo } from '../types/project/SymbolInfo';
import type { SymbolExtractionOptions } from './index';
import findSymbolDependencies from './findSymbolDependencies';

/**
 * 计算符号依赖关系
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 * @param options - 符号提取选项
 */
const calculateDependencies = (
  symbols: ExtractedSymbols,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  options: SymbolExtractionOptions
): void => {
  const processSymbols = (symbolMap: Map<string, SymbolInfo>) => {
    symbolMap.forEach(symbolInfo => {
      if (symbolInfo.declaration) {
        symbolInfo.dependencies = findSymbolDependencies(
          symbolInfo.declaration,
          symbols,
          typeChecker,
          sourceFile,
          options
        );
      }
    });
  };

  processSymbols(symbols.exports);
  processSymbols(symbols.internal);
};

export default calculateDependencies; 