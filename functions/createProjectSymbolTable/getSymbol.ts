import type { ProjectSymbolTableState } from '@t/project/ProjectSymbolTableState';
import type { SymbolInfo } from '@t/project/SymbolInfo';

/**
 * 获取符号信息
 * @param symbolTable - 符号表状态
 * @param symbolName - 符号名称
 * @returns 符号信息或undefined
 */
const getSymbol = (
  symbolTable: ProjectSymbolTableState,
  symbolName: string
): SymbolInfo | undefined => {
  return symbolTable.globalSymbols.get(symbolName);
};

export default getSymbol; 