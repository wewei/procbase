import ts from 'typescript';
import type { ProjectSymbolTableState } from '@t/project/ProjectSymbolTableState';

/**
 * 项目分析上下文
 * 
 * 包含项目分析过程中需要的所有上下文信息，包括 TypeScript 程序、
 * 类型检查器、符号表等。这个上下文对象在整个分析过程中被传递，
 * 确保所有分析函数都能访问到必要的信息。
 * 
 * @example
 * ```typescript
 * const context: ProjectAnalysisContext = {
 *   program: ts.createProgram(['src/main.ts'], {}),
 *   typeChecker: program.getTypeChecker(),
 *   symbolTable: createProjectSymbolTable(),
 *   rootFiles: ['src/main.ts'],
 *   compilerOptions: { target: 'ES2020' }
 * };
 * ```
 */
export type ProjectAnalysisContext = {
  /** TypeScript 程序实例，包含所有源文件和编译信息 */
  program: ts.Program;
  /** TypeScript 类型检查器，用于类型分析和符号解析 */
  typeChecker: ts.TypeChecker;
  /** 项目符号表，存储所有提取的符号信息 */
  symbolTable: ProjectSymbolTableState;
  /** 根文件列表，项目的主要入口文件 */
  rootFiles: string[];
  /** TypeScript 编译器选项，影响编译和分析行为 */
  compilerOptions: ts.CompilerOptions;
}; 