import type { SymbolInfo } from './SymbolInfo';
import type { FileSymbols } from './FileSymbols';

/**
 * 项目符号表状态
 * 
 * 描述整个项目的符号表状态，包含所有文件的符号信息、
 * 全局符号、依赖关系等。这是符号分析的核心数据结构，
 * 用于存储和管理项目级别的符号信息。
 * 
 * @example
 * ```typescript
 * const symbolTableState: ProjectSymbolTableState = {
 *   fileSymbols: new Map([
 *     ['utils.ts', { fileName: 'utils.ts', symbols: {...} }]
 *   ]),
 *   globalSymbols: new Map([
 *     ['globalConfig', { name: 'globalConfig', ... }]
 *   ]),
 *   dependencies: new Map([
 *     ['calculateTotal', new Set(['Price', 'TaxRate'])]
 *   ]),
 *   reverseDependencies: new Map([
 *     ['Price', new Set(['calculateTotal', 'calculateDiscount'])]
 *   ])
 * };
 * ```
 */
export type ProjectSymbolTableState = {
  /** 文件符号映射，键为文件路径，值为文件符号信息 */
  fileSymbols: Map<string, FileSymbols>;
  /** 全局符号映射，键为符号名称，值为符号信息 */
  globalSymbols: Map<string, SymbolInfo>;
  /** 依赖关系映射，键为符号名称，值为依赖的符号集合 */
  dependencies: Map<string, Set<string>>;
  /** 反向依赖关系映射，键为符号名称，值为依赖此符号的符号集合 */
  reverseDependencies: Map<string, Set<string>>;
}; 