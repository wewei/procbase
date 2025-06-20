import type { ProjectSymbolTableState, ProjectStatistics } from '../types';
import getAllSymbols from '../createProjectSymbolTable/getAllSymbols';

/**
 * 计算项目统计信息
 * @param symbolTable - 符号表
 * @param rootFiles - 根文件列表
 * @returns 项目统计信息
 */
const calculateStatistics = (
  symbolTable: ProjectSymbolTableState,
  rootFiles: string[]
): ProjectStatistics => {
  let totalSymbols = 0;
  let exportedSymbols = 0;
  let internalSymbols = 0;
  let importCount = 0;
  let dependencyCount = 0;

  symbolTable.fileSymbols.forEach(fileSymbols => {
    totalSymbols += fileSymbols.symbols.exports.size + fileSymbols.symbols.internal.size;
    exportedSymbols += fileSymbols.symbols.exports.size;
    internalSymbols += fileSymbols.symbols.internal.size;
    importCount += fileSymbols.symbols.imports.size;
  });

  symbolTable.dependencies.forEach(deps => {
    dependencyCount += deps.size;
  });

  return {
    totalFiles: rootFiles.length,
    totalSymbols,
    exportedSymbols,
    internalSymbols,
    importCount,
    dependencyCount
  };
};

export default calculateStatistics; 