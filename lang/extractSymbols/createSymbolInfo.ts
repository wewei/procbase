import ts from 'typescript';
import path from 'node:path';
import type { SymbolInfo } from '../types';
import getSourceLocation from './getSourceLocation';

/**
 * 创建符号信息
 * @param symbol - 符号
 * @param declaration - 声明
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 * @returns 符号信息
 */
const createSymbolInfo = (
  symbol: ts.Symbol,
  declaration: ts.Declaration,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): SymbolInfo => {
  const type = typeChecker.typeToString(
    typeChecker.getTypeOfSymbolAtLocation(symbol, declaration)
  );

  return {
    name: symbol.name,
    kind: symbol.flags,
    type,
    declaration,
    isExported: !!(symbol.flags & ts.SymbolFlags.ExportValue),
    documentation: ts.displayPartsToString(symbol.getDocumentationComment(typeChecker)),
    sourceLocation: getSourceLocation(declaration, sourceFile),
    fileName: path.basename(sourceFile.fileName),
    dependencies: new Set(),
    dependents: new Set()
  };
};

export default createSymbolInfo; 