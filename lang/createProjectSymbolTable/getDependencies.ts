import type { ProjectSymbolTableState } from '../types';

/**
 * 获取符号的直接依赖
 * @param symbolTable - 符号表状态
 * @param symbolName - 符号名称
 * @returns 依赖符号集合
 */
const getDependencies = (
  symbolTable: ProjectSymbolTableState,
  symbolName: string
): Set<string> => {
  return symbolTable.dependencies.get(symbolName) || new Set();
};

export default getDependencies; 