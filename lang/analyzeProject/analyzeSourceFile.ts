import ts from 'typescript';
import extractSymbolsFromFile from '../extractSymbols';
import type { FileSymbols } from '../createProjectSymbolTable/types';
import type { AnalysisOptions } from '../types';

/**
 * 分析单个源文件
 * @param sourceFile - 源文件
 * @param typeChecker - 类型检查器
 * @param options - 分析选项
 * @returns 文件符号信息
 */
const analyzeSourceFile = (
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  options: AnalysisOptions = {}
): FileSymbols => {
  console.log(`正在分析文件: ${sourceFile.fileName}`);
  const symbols = extractSymbolsFromFile(sourceFile, typeChecker, {
    includeNodeModules: options.includeNodeModules ?? false,
    includeSystemSymbols: options.includeSystemSymbols ?? false
  });
  
  return {
    fileName: sourceFile.fileName,
    symbols
  };
};

export default analyzeSourceFile; 