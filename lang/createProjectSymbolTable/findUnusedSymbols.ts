import type { ProjectSymbolTableState } from '../types';
import calculateClosure from './calculateClosure';

/**
 * 查找未使用的符号
 * @param symbolTable - 符号表状态
 * @param exportedSymbols - 导出的符号列表
 * @returns 未使用的符号集合
 */
const findUnusedSymbols = (
  symbolTable: ProjectSymbolTableState,
  exportedSymbols: string[]
): Set<string> => {
  const usedSymbols = calculateClosure(symbolTable, exportedSymbols);
  const allSymbols = new Set(symbolTable.globalSymbols.keys());
  
  const unusedSymbols = new Set<string>();
  allSymbols.forEach(symbol => {
    if (!usedSymbols.has(symbol)) {
      unusedSymbols.add(symbol);
    }
  });
  
  return unusedSymbols;
};

export default findUnusedSymbols; 