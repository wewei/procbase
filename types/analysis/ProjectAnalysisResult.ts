import ts from 'typescript';
import type { ProjectSymbolTableState } from '@t/project/ProjectSymbolTableState';
import type { ProjectStatistics } from './ProjectStatistics';

/**
 * 项目分析结果
 * 
 * 包含项目分析完成后产生的所有信息，包括符号表、根文件列表、
 * 编译器选项、诊断信息和统计信息。这是项目分析的主要输出，
 * 包含了分析过程中收集的所有数据。
 * 
 * @example
 * ```typescript
 * const result: ProjectAnalysisResult = {
 *   symbolTable: createProjectSymbolTable(),
 *   rootFiles: ['src/main.ts', 'src/utils.ts'],
 *   compilerOptions: { target: 'ES2020', module: 'ESNext' },
 *   diagnostics: [],
 *   statistics: { totalFiles: 2, totalSymbols: 15, ... }
 * };
 * ```
 */
export type ProjectAnalysisResult = {
  /** 项目符号表，包含所有提取的符号信息和依赖关系 */
  symbolTable: ProjectSymbolTableState;
  /** 根文件列表，项目的主要入口文件 */
  rootFiles: string[];
  /** TypeScript 编译器选项，用于项目编译配置 */
  compilerOptions: ts.CompilerOptions;
  /** 编译诊断信息，包含错误和警告 */
  diagnostics: ts.Diagnostic[];
  /** 项目统计信息，包含各种量化指标 */
  statistics: ProjectStatistics;
}; 