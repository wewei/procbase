import ts from 'typescript';
import type { ExtractedSymbols } from '../types/project/ExtractedSymbols';
import createSymbolInfo from './createSymbolInfo';
import addSymbol from './addSymbol';
import hasExportModifier from './hasExportModifier';

/**
 * 处理枚举声明
 * @param decl - 枚举声明
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 */
const handleEnumDeclaration = (
  decl: ts.EnumDeclaration,
  symbols: ExtractedSymbols,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): void => {
  const symbol = typeChecker.getSymbolAtLocation(decl.name);
  if (symbol) {
    const isExported = hasExportModifier(decl);
    const symbolInfo = createSymbolInfo(symbol, decl, typeChecker, sourceFile);
    addSymbol(symbolInfo, isExported, symbols);
  }
};

export default handleEnumDeclaration; 