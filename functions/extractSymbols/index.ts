import ts from 'typescript';
import type { ExtractedSymbols } from '@t/project/ExtractedSymbols';
import type { SymbolExtractionOptions } from '@t/analysis/ExtractSymbolOptions';
import processStatement from './processStatement';
import calculateDependencies from './calculateDependencies';

/**
 * 从源文件中提取所有符号
 * @param sourceFile - 源文件
 * @param typeChecker - 类型检查器
 * @param options - 符号提取选项
 * @returns 提取的符号集合
 */
const extractSymbolsFromFile = (
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  options: SymbolExtractionOptions = { includeNodeModules: false, includeSystemSymbols: false }
): ExtractedSymbols => {
  const symbols: ExtractedSymbols = {
    exports: new Map(),
    internal: new Map(),
    imports: new Map()
  };

  // 遍历顶层语句
  sourceFile.statements.forEach(statement => {
    processStatement(statement, symbols, typeChecker, sourceFile);
  });

  // 计算符号依赖关系
  calculateDependencies(symbols, typeChecker, sourceFile, options);

  return symbols;
};

export default extractSymbolsFromFile; 