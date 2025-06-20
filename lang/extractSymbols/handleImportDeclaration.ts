import ts from 'typescript';
import type { ExtractedSymbols } from '../types/project/ExtractedSymbols';
import type { ImportInfo } from '../types/project/ImportInfo';
import resolveRelativePath from './resolveRelativePath';

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

export default handleImportDeclaration; 