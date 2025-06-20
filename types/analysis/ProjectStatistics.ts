/**
 * 项目统计信息
 * 
 * 包含项目分析过程中收集的各种统计指标，用于了解项目的
 * 规模和复杂度。这些统计数据可以帮助开发者评估项目的
 * 维护性和性能特征。
 * 
 * @example
 * ```typescript
 * const stats: ProjectStatistics = {
 *   totalFiles: 10,
 *   totalSymbols: 150,
 *   exportedSymbols: 45,
 *   internalSymbols: 105,
 *   importCount: 67,
 *   dependencyCount: 234
 * };
 * ```
 */
export type ProjectStatistics = {
  /** 总文件数量，包括所有分析的源文件 */
  totalFiles: number;
  /** 总符号数量，包括导出和内部符号 */
  totalSymbols: number;
  /** 导出符号数量，可以被其他模块使用的符号 */
  exportedSymbols: number;
  /** 内部符号数量，仅在模块内部使用的符号 */
  internalSymbols: number;
  /** 导入语句数量，从其他模块导入的符号数量 */
  importCount: number;
  /** 依赖关系数量，符号之间的依赖连接数 */
  dependencyCount: number;
}; 