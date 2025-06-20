/**
 * 导入信息
 * 
 * 描述从其他模块导入的符号信息，包括本地名称、源模块、
 * 导入类型等。这个信息用于跟踪模块间的依赖关系和
 * 符号的导入来源。
 * 
 * @example
 * ```typescript
 * const importInfo: ImportInfo = {
 *   name: 'calculateTotal',
 *   fromModule: './utils',
 *   isDefault: false,
 *   originalName: 'calculateTotal'
 * };
 * 
 * // 重命名导入
 * const renamedImport: ImportInfo = {
 *   name: 'calc',
 *   fromModule: './utils',
 *   isDefault: false,
 *   originalName: 'calculateTotal'
 * };
 * ```
 */
export type ImportInfo = {
  /** 本地名称，在当前模块中使用的名称 */
  name: string;
  /** 源模块路径，导入符号的来源模块 */
  fromModule: string;
  /** 是否为默认导入，如 `import calc from './utils'` */
  isDefault: boolean;
  /** 原始名称，在源模块中的实际名称（用于重命名导入） */
  originalName?: string;
}; 