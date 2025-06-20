import type { ProjectSymbolTableState } from '../types/project/ProjectSymbolTableState';

/**
 * 获取依赖于某个符号的符号
 * @param symbolTable - 符号表状态
 * @param symbolName - 符号名称
 * @returns 依赖者符号集合
 */
const getDependents = (
  symbolTable: ProjectSymbolTableState,
  symbolName: string
): Set<string> => {
  return symbolTable.reverseDependencies.get(symbolName) || new Set();
};

export default getDependents; 