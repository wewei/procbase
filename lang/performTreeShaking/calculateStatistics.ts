import type { ProjectSymbolTableState, TreeShakingStatistics } from '../types';
import getAllSymbols from '../createProjectSymbolTable/getAllSymbols';

/**
 * 计算统计信息
 * @param symbolTable - 符号表
 * @param includedSymbols - 包含的符号
 * @param unusedSymbols - 未使用的符号
 * @returns 统计信息
 */
const calculateStatistics = (
  symbolTable: ProjectSymbolTableState,
  includedSymbols: Set<string>,
  unusedSymbols: Set<string>
): TreeShakingStatistics => {
  const totalSymbols = getAllSymbols(symbolTable).size;
  const includedCount = includedSymbols.size;
  const unusedCount = unusedSymbols.size;
  const removalRate = totalSymbols > 0 ? (unusedCount / totalSymbols) * 100 : 0;
  
  return {
    totalSymbols,
    includedSymbols: includedCount,
    unusedSymbols: unusedCount,
    removalRate: Math.round(removalRate * 100) / 100
  };
};

export default calculateStatistics; 