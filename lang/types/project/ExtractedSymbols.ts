import type { SymbolInfo } from './SymbolInfo';
import type { ImportInfo } from './ImportInfo';

/**
 * 提取的符号集合
 * 
 * 包含从单个文件中提取的所有符号信息，按类型分类：
 * 导出符号、内部符号和导入符号。这个结构用于组织
 * 文件级别的符号信息，便于后续的分析和处理。
 * 
 * @example
 * ```typescript
 * const extractedSymbols: ExtractedSymbols = {
 *   exports: new Map([
 *     ['calculateTotal', { name: 'calculateTotal', isExported: true, ... }]
 *   ]),
 *   internal: new Map([
 *     ['helper', { name: 'helper', isExported: false, ... }]
 *   ]),
 *   imports: new Map([
 *     ['lodash', { name: 'lodash', fromModule: 'lodash', ... }]
 *   ])
 * };
 * ```
 */
export type ExtractedSymbols = {
  /** 导出符号映射，键为符号名称，值为符号信息 */
  exports: Map<string, SymbolInfo>;
  /** 内部符号映射，键为符号名称，值为符号信息 */
  internal: Map<string, SymbolInfo>;
  /** 导入符号映射，键为本地名称，值为导入信息 */
  imports: Map<string, ImportInfo>;
}; 