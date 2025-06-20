import ts from 'typescript';
import path from 'node:path';
import type { ExtractedSymbols } from '../types/project/ExtractedSymbols';
import type { SymbolExtractionOptions } from './index';

/**
 * 查找符号依赖
 * @param node - AST节点
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 * @param options - 符号提取选项
 * @returns 依赖的符号集合
 */
const findSymbolDependencies = (
  node: ts.Node,
  symbols: ExtractedSymbols,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  options: SymbolExtractionOptions
): Set<string> => {
  const dependencies = new Set<string>();
  const visited = new Set<ts.Node>();
  const localFunctions = new Set<string>();
  const localVariables = new Set<string>();

  // 首先收集所有局部函数和变量
  const collectLocals = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node)) {
      if (node.initializer) {
        if (ts.isFunctionExpression(node.initializer) || ts.isArrowFunction(node.initializer)) {
          if (ts.isIdentifier(node.name)) {
            localFunctions.add(node.name.text);
          }
        }
      }
      if (ts.isIdentifier(node.name)) {
        localVariables.add(node.name.text);
      }
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      localFunctions.add(node.name.text);
    }
    node.forEachChild(child => collectLocals(child));
  };

  collectLocals(node);

  const collectDependencies = (node: ts.Node) => {
    if (visited.has(node)) return;
    visited.add(node);

    if (ts.isIdentifier(node)) {
      // 如果标识符是属性访问的一部分，不添加为依赖
      if (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
        return;
      }

      const symbol = typeChecker.getSymbolAtLocation(node);
      if (symbol) {
        const declaration = symbol.declarations?.[0];
        if (declaration) {
          const declSourceFile = declaration.getSourceFile();
          const symbolName = symbol.name;

          // 如果是局部函数或变量，不添加为依赖
          if (localFunctions.has(symbolName) || localVariables.has(symbolName)) {
            return;
          }

          // 检查是否是导入的符号
          const importInfo = symbols.imports.get(symbolName);
          const symbolId = importInfo 
            ? `${importInfo.fromModule}:${importInfo.originalName || symbolName}`
            : `${path.basename(declSourceFile.fileName)}:${symbolName}`;

          // 检查是否是系统符号
          const isSystemSymbol = declSourceFile.fileName.includes('node_modules/typescript/lib/');
          if (isSystemSymbol && !options.includeSystemSymbols) {
            return;
          }

          // 检查是否是 node_modules 中的符号
          const isNodeModuleSymbol = declSourceFile.fileName.includes('node_modules/') && 
            !declSourceFile.fileName.includes('node_modules/typescript/lib/');
          if (isNodeModuleSymbol && !options.includeNodeModules) {
            return;
          }

          // 如果是参数声明，不添加为依赖
          if (ts.isParameter(declaration)) {
            return;
          }

          // 如果是当前符号的声明，不添加为依赖
          // 对于函数表达式，需要检查父级变量声明
          let currentNode: ts.Node | undefined = node;
          while (currentNode) {
            if (currentNode === declaration || 
                (ts.isVariableDeclaration(currentNode) && currentNode.name === node)) {
              return;
            }
            currentNode = currentNode.parent;
          }

          // 如果是接口或类型的属性，不添加为依赖
          if (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)) {
            return;
          }

          // 如果是类型引用，不添加为依赖
          if (ts.isTypeReferenceNode(node.parent) || 
              ts.isTypeAliasDeclaration(declaration) || 
              ts.isInterfaceDeclaration(declaration) ||
              ts.isClassDeclaration(declaration)) {
            return;
          }

          dependencies.add(symbolId);
        }
      }
    }

    node.forEachChild(child => collectDependencies(child));
  };

  collectDependencies(node);
  return dependencies;
};

export default findSymbolDependencies; 