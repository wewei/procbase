import type { ProjectSymbolTableState } from '@t/project/ProjectSymbolTableState';
import type { SymbolInfo } from '@t/project/SymbolInfo';

/**
 * 获取所有符号
 * @param symbolTable - 符号表状态
 * @returns 所有符号的映射
 */
const getAllSymbols = (symbolTable: ProjectSymbolTableState): Map<string, SymbolInfo> => {
  return symbolTable.globalSymbols;
};

export default getAllSymbols; 