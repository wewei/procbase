/**
 * 源码位置信息
 * 
 * 描述符号或节点在源码中的精确位置，包括字符偏移量、
 * 行号和列号。这个信息用于错误报告、代码导航和
 * 源码映射等功能。
 * 
 * @example
 * ```typescript
 * const location: SourceLocation = {
 *   start: 100,
 *   end: 150,
 *   line: 5,
 *   column: 10
 * };
 * ```
 */
export type SourceLocation = {
  /** 起始字符偏移量，从文件开头开始计算 */
  start: number;
  /** 结束字符偏移量，从文件开头开始计算 */
  end: number;
  /** 行号，从 1 开始计数 */
  line: number;
  /** 列号，从 1 开始计数 */
  column: number;
}; 