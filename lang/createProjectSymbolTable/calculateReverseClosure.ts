import type { ProjectSymbolTableState } from '../types/project/ProjectSymbolTableState';
import getDependents from './getDependents';

/**
 * 计算反向闭包 - 给定符号，计算所有依赖它的符号
 * @param symbolTable - 符号表状态
 * @param targetSymbols - 目标符号列表
 * @returns 反向闭包集合
 */
const calculateReverseClosure = (
  symbolTable: ProjectSymbolTableState,
  targetSymbols: string[]
): Set<string> => {
  const closure = new Set<string>();
  const visited = new Set<string>();
  const queue = [...targetSymbols];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (visited.has(current)) {
      continue;
    }
    
    visited.add(current);
    closure.add(current);

    // 添加所有依赖者到队列
    const dependents = getDependents(symbolTable, current);
    dependents.forEach(dependent => {
      if (!visited.has(dependent)) {
        queue.push(dependent);
      }
    });
  }

  return closure;
};

export default calculateReverseClosure; 