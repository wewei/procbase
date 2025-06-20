import type { ProjectSymbolTableState, FileSymbols } from './types';

/**
 * 获取文件中的所有符号
 * @param symbolTable - 符号表状态
 * @param fileName - 文件名
 * @returns 文件符号信息或undefined
 */
const getFileSymbols = (
  symbolTable: ProjectSymbolTableState,
  fileName: string
): FileSymbols | undefined => {
  return symbolTable.fileSymbols.get(fileName);
};

export default getFileSymbols; 