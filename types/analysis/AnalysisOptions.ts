/**
 * 分析选项
 * 
 * 控制项目分析行为的配置选项，允许用户自定义分析的范围
 * 和深度。这些选项可以影响分析的性能、准确性和完整性。
 * 
 * @example
 * ```typescript
 * const options: AnalysisOptions = {
 *   includeDeclarationFiles: false,
 *   includeNodeModules: false,
 *   includeSystemSymbols: false,
 *   followTypeOnlyImports: true,
 *   maxDepth: 5
 * };
 * ```
 */
export type AnalysisOptions = {
  /** 是否包含声明文件（.d.ts），默认为 false */
  includeDeclarationFiles?: boolean;
  /** 是否包含 node_modules 中的依赖，默认为 false */
  includeNodeModules?: boolean;
  /** 是否包含系统符号（如内置类型），默认为 false */
  includeSystemSymbols?: boolean;
  /** 是否跟踪仅类型导入，默认为 true */
  followTypeOnlyImports?: boolean;
  /** 最大分析深度，防止无限递归，默认为 10 */
  maxDepth?: number;
}; 