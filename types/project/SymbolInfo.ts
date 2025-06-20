import ts from 'typescript';
import type { SourceLocation } from './SourceLocation';

/**
 * 符号信息
 * 
 * 描述 TypeScript 代码中一个符号的完整信息，包括名称、类型、
 * 声明位置、导出状态、文档注释等。这个类型是符号表的核心，
 * 包含了分析符号所需的所有元数据。
 * 
 * @example
 * ```typescript
 * const symbolInfo: SymbolInfo = {
 *   name: 'calculateTotal',
 *   kind: ts.SymbolFlags.Function,
 *   type: '(price: number, tax: number) => number',
 *   declaration: functionDeclaration,
 *   isExported: true,
 *   documentation: '计算包含税费的总价',
 *   sourceLocation: { start: 100, end: 150, line: 5, column: 10 },
 *   fileName: 'utils.ts',
 *   dependencies: new Set(['Price', 'TaxRate']),
 *   dependents: new Set(['main', 'test'])
 * };
 * ```
 */
export type SymbolInfo = {
  /** 符号的名称，用于标识和引用 */
  name: string;
  /** 符号的类型标志，表示符号的种类（函数、类、变量等） */
  kind: ts.SymbolFlags;
  /** 符号的类型字符串表示，用于类型检查和分析 */
  type: string;
  /** TypeScript 声明节点，包含符号的语法信息 */
  declaration: ts.Declaration;
  /** 是否为导出符号，可以被其他模块使用 */
  isExported: boolean;
  /** 符号的文档注释，包含使用说明和描述 */
  documentation?: string;
  /** 符号在源码中的位置信息 */
  sourceLocation: SourceLocation;
  /** 符号所在的文件名 */
  fileName: string;
  /** 符号的依赖项集合，该符号依赖的其他符号 */
  dependencies: Set<string>;
  /** 依赖于此符号的其他符号集合 */
  dependents: Set<string>;
}; 