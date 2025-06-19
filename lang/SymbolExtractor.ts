import * as ts from 'typescript';
import path from 'node:path';
import type { SymbolInfo, ImportInfo, ExtractedSymbols, SourceLocation } from './SymbolTable';

/**
 * 从源文件中提取所有符号
 * @param sourceFile - 源文件
 * @param typeChecker - 类型检查器
 * @returns 提取的符号集合
 */
export const extractSymbolsFromFile = (
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
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
  calculateDependencies(symbols, typeChecker, sourceFile);

  return symbols;
};

/**
 * 处理语句
 * @param statement - 语句节点
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 */
const processStatement = (
  statement: ts.Statement,
  symbols: ExtractedSymbols,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): void => {
  switch (statement.kind) {
    case ts.SyntaxKind.VariableStatement:
      handleVariableStatement(statement as ts.VariableStatement, symbols, typeChecker, sourceFile);
      break;
    case ts.SyntaxKind.FunctionDeclaration:
      handleFunctionDeclaration(statement as ts.FunctionDeclaration, symbols, typeChecker, sourceFile);
      break;
    case ts.SyntaxKind.ClassDeclaration:
      handleClassDeclaration(statement as ts.ClassDeclaration, symbols, typeChecker, sourceFile);
      break;
    case ts.SyntaxKind.InterfaceDeclaration:
      handleInterfaceDeclaration(statement as ts.InterfaceDeclaration, symbols, typeChecker, sourceFile);
      break;
    case ts.SyntaxKind.TypeAliasDeclaration:
      handleTypeAliasDeclaration(statement as ts.TypeAliasDeclaration, symbols, typeChecker, sourceFile);
      break;
    case ts.SyntaxKind.EnumDeclaration:
      handleEnumDeclaration(statement as ts.EnumDeclaration, symbols, typeChecker, sourceFile);
      break;
    case ts.SyntaxKind.ImportDeclaration:
      handleImportDeclaration(statement as ts.ImportDeclaration, symbols, sourceFile);
      break;
    case ts.SyntaxKind.ExportDeclaration:
      handleExportDeclaration(statement as ts.ExportDeclaration, symbols);
      break;
    case ts.SyntaxKind.ModuleDeclaration:
      handleModuleDeclaration(statement as ts.ModuleDeclaration, symbols, typeChecker, sourceFile);
      break;
  }
};

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
        const symbolInfo = createSymbolInfo(symbol, decl, typeChecker, sourceFile);
        addSymbol(symbolInfo, isExported, symbols);
      }
    }
  });
};

/**
 * 处理函数声明
 * @param decl - 函数声明
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 */
const handleFunctionDeclaration = (
  decl: ts.FunctionDeclaration,
  symbols: ExtractedSymbols,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): void => {
  if (decl.name && ts.isIdentifier(decl.name)) {
    const symbol = typeChecker.getSymbolAtLocation(decl.name);
    if (symbol) {
      const isExported = hasExportModifier(decl);
      const symbolInfo = createSymbolInfo(symbol, decl, typeChecker, sourceFile);
      addSymbol(symbolInfo, isExported, symbols);
    }
  }
};

/**
 * 处理类声明
 * @param decl - 类声明
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 */
const handleClassDeclaration = (
  decl: ts.ClassDeclaration,
  symbols: ExtractedSymbols,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): void => {
  if (decl.name && ts.isIdentifier(decl.name)) {
    const symbol = typeChecker.getSymbolAtLocation(decl.name);
    if (symbol) {
      const isExported = hasExportModifier(decl);
      const symbolInfo = createSymbolInfo(symbol, decl, typeChecker, sourceFile);
      addSymbol(symbolInfo, isExported, symbols);
    }
  }
};

/**
 * 处理接口声明
 * @param decl - 接口声明
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 */
const handleInterfaceDeclaration = (
  decl: ts.InterfaceDeclaration,
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

/**
 * 处理类型别名声明
 * @param decl - 类型别名声明
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 */
const handleTypeAliasDeclaration = (
  decl: ts.TypeAliasDeclaration,
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

/**
 * 处理模块声明
 * @param decl - 模块声明
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 */
const handleModuleDeclaration = (
  decl: ts.ModuleDeclaration,
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

/**
 * 处理导入声明
 * @param importDecl - 导入声明
 * @param symbols - 符号集合
 * @param sourceFile - 源文件
 */
const handleImportDeclaration = (
  importDecl: ts.ImportDeclaration,
  symbols: ExtractedSymbols,
  sourceFile: ts.SourceFile
): void => {
  const moduleSpecifier = (importDecl.moduleSpecifier as ts.StringLiteral).text;
  
  if (importDecl.importClause) {
    // 默认导入: import Foo from 'module'
    if (importDecl.importClause.name) {
      symbols.imports.set(importDecl.importClause.name.text, {
        name: importDecl.importClause.name.text,
        moduleSpecifier,
        importType: 'default',
        originalName: 'default',
        fileName: sourceFile.fileName
      });
    }
    
    // 命名导入和命名空间导入
    if (importDecl.importClause.namedBindings) {
      if (ts.isNamedImports(importDecl.importClause.namedBindings)) {
        // 命名导入: import { a, b as c } from 'module'
        importDecl.importClause.namedBindings.elements.forEach(element => {
          const localName = element.name.text;
          const originalName = element.propertyName?.text ?? localName;
          
          symbols.imports.set(localName, {
            name: localName,
            moduleSpecifier,
            importType: 'named',
            originalName,
            fileName: sourceFile.fileName
          });
        });
      } else if (ts.isNamespaceImport(importDecl.importClause.namedBindings)) {
        // 命名空间导入: import * as ns from 'module'
        symbols.imports.set(importDecl.importClause.namedBindings.name.text, {
          name: importDecl.importClause.namedBindings.name.text,
          moduleSpecifier,
          importType: 'namespace',
          originalName: '*',
          fileName: sourceFile.fileName
        });
      }
    }
  }
};

/**
 * 处理导出声明
 * @param exportDecl - 导出声明
 * @param symbols - 符号集合
 */
const handleExportDeclaration = (
  exportDecl: ts.ExportDeclaration,
  symbols: ExtractedSymbols
): void => {
  // 这里主要处理 export { a, b } from 'module' 的情况
  // 具体的符号导出会在各个声明中处理
};

/**
 * 创建符号信息
 * @param symbol - TypeScript符号
 * @param declaration - 声明节点
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
  const type = typeChecker.getTypeOfSymbolAtLocation(symbol, declaration);
  
  return {
    name: symbol.getName(),
    kind: symbol.flags,
    type: typeChecker.typeToString(type),
    declaration,
    isExported: hasExportModifier(declaration),
    documentation: ts.displayPartsToString(symbol.getDocumentationComment(typeChecker)),
    sourceLocation: getSourceLocation(declaration, sourceFile),
    fileName: sourceFile.fileName,
    dependencies: new Set(),
    dependents: new Set()
  };
};

/**
 * 添加符号到符号表
 * @param symbolInfo - 符号信息
 * @param isExported - 是否导出
 * @param symbols - 符号集合
 */
const addSymbol = (
  symbolInfo: SymbolInfo,
  isExported: boolean,
  symbols: ExtractedSymbols
): void => {
  if (isExported) {
    symbols.exports.set(symbolInfo.name, symbolInfo);
  } else {
    symbols.internal.set(symbolInfo.name, symbolInfo);
  }
};

/**
 * 检查是否有导出修饰符
 * @param node - 节点
 * @returns 是否有导出修饰符
 */
const hasExportModifier = (node: ts.Node): boolean => {
  return (node as any).modifiers?.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
};

/**
 * 获取源码位置
 * @param node - 节点
 * @param sourceFile - 源文件
 * @returns 源码位置信息
 */
const getSourceLocation = (node: ts.Node, sourceFile: ts.SourceFile): SourceLocation => {
  const start = node.getStart();
  const end = node.getEnd();
  const lineInfo = sourceFile.getLineAndCharacterOfPosition(start);
  
  return { 
    start, 
    end, 
    line: lineInfo?.line ?? 0, 
    column: lineInfo?.character ?? 0 
  };
};

/**
 * 计算符号依赖关系
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 */
const calculateDependencies = (
  symbols: ExtractedSymbols,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): void => {
  const allSymbols = new Map(Array.from(symbols.exports).concat(Array.from(symbols.internal)));
  
  allSymbols.forEach((symbolInfo, symbolName) => {
    const dependencies = findSymbolDependencies(symbolInfo.declaration, symbols, typeChecker, sourceFile);
    symbolInfo.dependencies = dependencies;
  });
};

/**
 * 查找符号的依赖关系
 * @param node - 节点
 * @param symbols - 符号集合
 * @param typeChecker - 类型检查器
 * @param sourceFile - 源文件
 * @returns 依赖符号集合
 */
const findSymbolDependencies = (
  node: ts.Node,
  symbols: ExtractedSymbols,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): Set<string> => {
  const dependencies = new Set<string>();

  // 收集所有参数和局部变量名
  const localNames = new Set<string>();
  const collectLocals = (node: ts.Node) => {
    if (ts.isFunctionLike(node)) {
      node.parameters.forEach(param => {
        if (ts.isIdentifier(param.name)) {
          localNames.add(param.name.text);
        }
      });
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      localNames.add(node.name.text);
    }
    ts.forEachChild(node, collectLocals);
  };
  collectLocals(node);

  // 获取当前顶层符号名（如函数名、变量名）
  let currentTopLevelName = '';
  if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node) || ts.isClassDeclaration(node)) && node.name && ts.isIdentifier(node.name)) {
    currentTopLevelName = node.name.text;
  }

  // 判断是否是类型节点
  function isTypeNodeOrChild(n: ts.Node): boolean {
    if (ts.isTypeNode(n)) return true;
    let parent = n.parent;
    while (parent) {
      if (ts.isTypeNode(parent)) return true;
      parent = parent.parent;
    }
    return false;
  }

  const visit = (node: ts.Node, isPropertyAccess: boolean = false) => {
    // 类型节点及其所有子节点全部跳过
    if (ts.isTypeNode(node)) return;

    // 查找标识符引用
    if (ts.isIdentifier(node)) {
      if (!isPropertyAccess) {
        const symbol = typeChecker.getSymbolAtLocation(node);
        if (symbol) {
          const symbolName = symbol.getName();
          // 只添加文件作用域顶层符号，且不是参数、不是局部变量、不是自身
          if ((symbols.exports.has(symbolName) || symbols.internal.has(symbolName))
            && !localNames.has(symbolName)
            && symbolName !== currentTopLevelName) {
            dependencies.add(`${sourceFile.fileName}:${symbolName}`);
          }
        }
      }
      return;
    }
    if (ts.isPropertyAccessExpression(node)) {
      // 只递归对象部分，属性名不递归
      visit(node.expression, false);
      return;
    }
    // 其它节点递归
    ts.forEachChild(node, child => visit(child, false));
  };

  visit(node);
  return dependencies;
};

/**
 * 解析相对路径
 * @param baseFile - 基础文件路径
 * @param relativePath - 相对路径
 * @returns 解析后的绝对路径
 */
const resolveRelativePath = (baseFile: string, relativePath: string): string => {
  const baseDir = path.dirname(baseFile);
  const resolved = path.resolve(baseDir, relativePath);
  
  // 添加 .ts 扩展名如果不存在
  if (!resolved.endsWith('.ts') && !resolved.endsWith('.js')) {
    return resolved + '.ts';
  }
  
  return resolved;
};
