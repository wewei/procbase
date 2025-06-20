import type { ProjectSymbolTableState } from './types';
import getDependencies from './getDependencies';

/**
 * 计算符号闭包 - 给定根符号，计算所有需要包含的符号
 * @param symbolTable - 符号表状态
 * @param rootSymbols - 根符号列表
 * @returns 符号闭包集合
 */
const calculateClosure = (
  symbolTable: ProjectSymbolTableState,
  rootSymbols: string[]
): Set<string> => {
  const closure = new Set<string>();
  const visited = new Set<string>();
  const queue = [...rootSymbols];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (visited.has(current)) {
      continue;
    }
    
    visited.add(current);
    closure.add(current);

    // 添加所有依赖到队列
    const deps = getDependencies(symbolTable, current);
    deps.forEach(dep => {
      if (!visited.has(dep)) {
        queue.push(dep);
      }
    });
  }

  return closure;
};

export default calculateClosure; 