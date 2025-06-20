import type { ProjectSymbolTableState } from '../SymbolTable/types';

/**
 * 按文件分组符号
 * @param symbols - 符号集合
 * @param symbolTable - 符号表
 * @returns 按文件分组的符号映射
 */
const groupSymbolsByFile = (
  symbols: Set<string>, 
  symbolTable: ProjectSymbolTableState
): Map<string, string[]> => {
  const result = new Map<string, string[]>();
  
  symbols.forEach(symbolName => {
    const parts = symbolName.split(':');
    if (parts.length >= 2) {
      const [fileName, localName] = parts;
      if (fileName && localName) {
        if (!result.has(fileName)) {
          result.set(fileName, []);
        }
        const fileArray = result.get(fileName);
        if (fileArray) {
          fileArray.push(localName);
        }
      }
    }
  });
  
  return result;
};

export default groupSymbolsByFile; 