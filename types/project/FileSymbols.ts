import type { ExtractedSymbols } from './ExtractedSymbols';

/**
 * 文件级别的符号信息
 * 
 * 描述单个文件中包含的所有符号信息，包括文件名和
 * 提取的符号集合。这个结构用于组织项目级别的
 * 符号表，按文件进行分组管理。
 * 
 * @example
 * ```typescript
 * const fileSymbols: FileSymbols = {
 *   fileName: 'utils.ts',
 *   symbols: {
 *     exports: new Map([...]),
 *     internal: new Map([...]),
 *     imports: new Map([...])
 *   }
 * };
 * ```
 */
export type FileSymbols = {
  /** 文件名，用于标识和引用 */
  fileName: string;
  /** 从该文件中提取的所有符号信息 */
  symbols: ExtractedSymbols;
}; 