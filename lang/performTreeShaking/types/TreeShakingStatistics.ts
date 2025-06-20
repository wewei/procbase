/**
 * Tree shaking 统计信息
 * 
 * 包含 Tree shaking 分析过程中的各种统计指标，用于评估
 * 代码优化的效果和项目的依赖复杂度。这些统计数据可以帮助
 * 开发者了解代码的冗余程度和优化潜力。
 * 
 * @example
 * ```typescript
 * const stats: TreeShakingStatistics = {
 *   totalSymbols: 100,
 *   includedSymbols: 75,
 *   unusedSymbols: 25,
 *   removalRate: 25.0
 * };
 * ```
 */
export type TreeShakingStatistics = {
  /** 总符号数量，包括所有定义的符号 */
  totalSymbols: number;
  /** 被包含的符号数量，最终构建中会保留的符号 */
  includedSymbols: number;
  /** 未使用的符号数量，可以被安全移除的符号 */
  unusedSymbols: number;
  /** 移除率百分比，表示被移除符号占总符号的比例 */
  removalRate: number;
}; 