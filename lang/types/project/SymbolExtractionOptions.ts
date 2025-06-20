/**
 * 符号提取选项
 * 
 * 控制符号提取过程的配置选项，决定哪些符号应该被包含
 * 在提取结果中。这些选项可以影响提取的完整性和性能。
 * 
 * @example
 * ```typescript
 * const options: SymbolExtractionOptions = {
 *   includeNodeModules: false,
 *   includeSystemSymbols: false
 * };
 * ```
 */
export type SymbolExtractionOptions = {
  /** 是否包含 node_modules 中的符号，默认为 false */
  includeNodeModules: boolean;
  /** 是否包含系统符号（如内置类型），默认为 false */
  includeSystemSymbols: boolean;
}; 