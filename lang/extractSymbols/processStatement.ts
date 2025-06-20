import type ts from 'typescript';
import type { ExtractedSymbols } from './types';
import handleVariableStatement from './handleVariableStatement';
import handleFunctionDeclaration from './handleFunctionDeclaration';
import handleClassDeclaration from './handleClassDeclaration';
import handleInterfaceDeclaration from './handleInterfaceDeclaration';
import handleTypeAliasDeclaration from './handleTypeAliasDeclaration';
import handleEnumDeclaration from './handleEnumDeclaration';
import handleModuleDeclaration from './handleModuleDeclaration';
import handleImportDeclaration from './handleImportDeclaration';
import handleExportDeclaration from './handleExportDeclaration';

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

export default processStatement; 