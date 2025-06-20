import ts from 'typescript';
import type { ExtractedSymbols } from '../types/project/ExtractedSymbols';
import createSymbolInfo from './createSymbolInfo';
import addSymbol from './addSymbol';
import hasExportModifier from './hasExportModifier';

/**
 * 处理变量声明
 * @param stmt - 变量声明语句
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 */
const handleVariableStatement = (
  stmt: ts.VariableStatement,
  symbols: ExtractedSymbols,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): void => {
  const isExported = hasExportModifier(stmt);
  
  stmt.declarationList.declarations.forEach(decl => {
    if (ts.isIdentifier(decl.name)) {
      const symbol = typeChecker.getSymbolAtLocation(decl.name);
      if (symbol) {
        // 如果变量声明是函数表达式，使用整个函数表达式作为声明
        let declaration: ts.Declaration = decl;
        if (decl.initializer && (
          ts.isArrowFunction(decl.initializer) || 
          ts.isFunctionExpression(decl.initializer)
        )) {
          declaration = decl.initializer;
        }
        const symbolInfo = createSymbolInfo(symbol, declaration, typeChecker, sourceFile);
        addSymbol(symbolInfo, isExported, symbols);
      }
    }
  });
};

export default handleVariableStatement; 