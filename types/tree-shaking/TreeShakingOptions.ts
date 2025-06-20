/**
 * Tree Shaking 选项
 * 
 * 控制 Tree shaking 分析行为的配置选项，允许用户自定义
 * 分析的范围和深度。这些选项可以影响分析的准确性和
 * 优化效果。
 * 
 * @example
 * ```typescript
 * const options: TreeShakingOptions = {
 *   includeInternalSymbols: false,
 *   followTypeOnlyImports: true,
 *   maxDepth: 10
 * };
 * ```
 */
export type TreeShakingOptions = {
  /** 是否包含内部符号，默认为 false */
  includeInternalSymbols?: boolean;
  /** 是否跟踪仅类型导入，默认为 true */
  followTypeOnlyImports?: boolean;
  /** 最大分析深度，防止无限递归，默认为 10 */
  maxDepth?: number;
}; 