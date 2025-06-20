import type { ProjectSymbolTableState, FileSymbols } from '../types';

/**
 * 添加文件符号到符号表
 * @param symbolTable - 符号表状态
 * @param fileSymbols - 文件符号信息
 * @returns 更新后的符号表状态
 */
const addFileSymbols = (
  symbolTable: ProjectSymbolTableState,
  fileSymbols: FileSymbols
): ProjectSymbolTableState => {
  symbolTable.fileSymbols.set(fileSymbols.fileName, fileSymbols);
  
  // 添加到全局符号表
  Array.from(fileSymbols.symbols.exports.values()).concat(Array.from(fileSymbols.symbols.internal.values()))
    .forEach(symbol => {
      const fullName = `${fileSymbols.fileName}:${symbol.name}`;
      symbolTable.globalSymbols.set(fullName, symbol);
      
      // 建立依赖关系
      symbolTable.dependencies.set(fullName, symbol.dependencies);
      symbol.dependencies.forEach((dep: string) => {
        if (!symbolTable.reverseDependencies.has(dep)) {
          symbolTable.reverseDependencies.set(dep, new Set());
        }
        symbolTable.reverseDependencies.get(dep)!.add(fullName);
      });
    });
  
  return symbolTable;
};

export default addFileSymbols; 