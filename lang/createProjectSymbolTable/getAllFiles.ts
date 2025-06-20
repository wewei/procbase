import type { ProjectSymbolTableState } from './types';

/**
 * 获取所有文件
 * @param symbolTable - 符号表状态
 * @returns 所有文件名列表
 */
const getAllFiles = (symbolTable: ProjectSymbolTableState): string[] => {
  return Array.from(symbolTable.fileSymbols.keys());
};

export default getAllFiles; 