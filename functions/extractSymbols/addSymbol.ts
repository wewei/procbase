import type { SymbolInfo } from '@t/project/SymbolInfo';
import type { ExtractedSymbols } from '@t/project/ExtractedSymbols';

/**
 * 添加符号到符号表
 * @param symbolInfo - 符号信息
 * @param isExported - 是否导出
 * @param symbols - 符号集合
 */
const addSymbol = (
  symbolInfo: SymbolInfo,
  isExported: boolean,
  symbols: ExtractedSymbols
): void => {
  if (isExported) {
    symbols.exports.set(symbolInfo.name, symbolInfo);
  } else {
    symbols.internal.set(symbolInfo.name, symbolInfo);
  }
};

export default addSymbol; 