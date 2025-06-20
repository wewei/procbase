import ts from 'typescript';
import type { ExtractedSymbols } from '@t/project/ExtractedSymbols';

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

export default handleExportDeclaration; 