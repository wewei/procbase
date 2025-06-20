import type { ProjectSymbolTableState } from '@t/project/ProjectSymbolTableState';

/**
 * 创建新的项目符号表
 * @returns 初始化的项目符号表状态
 */
const createProjectSymbolTable = (): ProjectSymbolTableState => ({
  fileSymbols: new Map(),
  globalSymbols: new Map(),
  dependencies: new Map(),
  reverseDependencies: new Map()
});

export default createProjectSymbolTable; 