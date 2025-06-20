import type { ProjectSymbolTableState } from '../../createProjectSymbolTable/types/ProjectSymbolTableState';
import type { TreeShakingStatistics } from './TreeShakingStatistics';

/**
 * Tree shaking 结果
 * 
 * 包含 Tree shaking 分析的结果，显示哪些符号被包含在最终构建中，
 * 哪些符号被移除，以及相关的统计信息。这个结果可以帮助开发者
 * 了解代码的依赖关系和优化效果。
 * 
 * @example
 * ```typescript
 * const result: TreeShakingResult = {
 *   entryPoints: ['main', 'utils'],
 *   includedSymbols: new Set(['main', 'utils', 'helper']),
 *   unusedSymbols: new Set(['deprecated', 'unused']),
 *   includedByFile: new Map([['main.ts', ['main']]]),
 *   unusedByFile: new Map([['utils.ts', ['deprecated']]]),
 *   symbolTable: createProjectSymbolTable(),
 *   statistics: { totalSymbols: 10, includedSymbols: 8, ... }
 * };
 * ```
 */
export type TreeShakingResult = {
  /** 入口点符号列表，Tree shaking 的起始点 */
  entryPoints: string[];
  /** 被包含的符号集合，最终构建中会保留的符号 */
  includedSymbols: Set<string>;
  /** 未使用的符号集合，可以被安全移除的符号 */
  unusedSymbols: Set<string>;
  /** 按文件分组的包含符号，文件路径到符号列表的映射 */
  includedByFile: Map<string, string[]>;
  /** 按文件分组的未使用符号，文件路径到符号列表的映射 */
  unusedByFile: Map<string, string[]>;
  /** 项目符号表，包含所有符号的完整信息 */
  symbolTable: ProjectSymbolTableState;
  /** Tree shaking 统计信息，包含各种量化指标 */
  statistics: TreeShakingStatistics;
}; 