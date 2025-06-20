import ts from 'typescript';
import path from 'node:path';
import type { ExtractedSymbols, SymbolInfo, ImportInfo, SourceLocation } from '../createProjectSymbolTable/types';

/**
 * 符号提取选项
 */
type SymbolExtractionOptions = {
  includeNodeModules: boolean;  // 是否包含 node_modules 中的依赖
  includeSystemSymbols: boolean;  // 是否包含系统符号
};

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
  if (!importDecl.moduleSpecifier || !ts.isStringLiteral(importDecl.moduleSpecifier)) {
    return;
  }

  const modulePath = importDecl.moduleSpecifier.text;
  const resolvedPath = resolveRelativePath(sourceFile.fileName, modulePath);

  if (importDecl.importClause) {
    // 处理默认导入
    if (importDecl.importClause.name) {
      const defaultImport: ImportInfo = {
        name: importDecl.importClause.name.text,
        fromModule: resolvedPath,
        isDefault: true
      };
      symbols.imports.set(defaultImport.name, defaultImport);
    }

    // 处理命名导入
    const namedBindings = importDecl.importClause.namedBindings;
    if (namedBindings) {
      if (ts.isNamedImports(namedBindings)) {
        namedBindings.elements.forEach(element => {
          const importInfo: ImportInfo = {
            name: element.name.text,
            fromModule: resolvedPath,
            isDefault: false,
            originalName: element.propertyName?.text || element.name.text
          };
          symbols.imports.set(importInfo.name, importInfo);
        });
      } else if (ts.isNamespaceImport(namedBindings)) {
        // 处理命名空间导入
        const importInfo: ImportInfo = {
          name: namedBindings.name.text,
          fromModule: resolvedPath,
          isDefault: false,
          originalName: '*'
        };
        symbols.imports.set(importInfo.name, importInfo);
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

/**
 * 解析相对路径
 * @param fromPath - 源文件路径
 * @param toPath - 目标文件路径
 * @returns 解析后的路径
 */
const resolveRelativePath = (fromPath: string, toPath: string): string => {
  // 如果是相对路径，则相对于当前文件解析
  if (toPath.startsWith('.')) {
    const fromDir = path.dirname(fromPath);
    return path.basename(path.resolve(fromDir, toPath));
  }
  return toPath;
};

export default extractSymbolsFromFile;
export type { SymbolExtractionOptions }; 