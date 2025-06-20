import type { TreeShakingResult } from '../types/tree-shaking/TreeShakingResult';
import type { TreeShakingOptions } from '../types/tree-shaking/TreeShakingOptions';
import type { ProjectAnalysisResult } from '../types/analysis/ProjectAnalysisResult';
import calculateClosure from '../createProjectSymbolTable/calculateClosure';
import findUnusedSymbols from '../createProjectSymbolTable/findUnusedSymbols';
import groupSymbolsByFile from './groupSymbolsByFile';
import calculateStatistics from './calculateStatistics';

/**
 * 执行 Tree Shaking 分析
 * @param projectAnalysis - 项目分析结果
 * @param entryPoints - 入口点列表
 * @param options - Tree Shaking 选项
 * @returns Tree Shaking 分析结果
 */
const performTreeShaking = (
  projectAnalysis: ProjectAnalysisResult,
  entryPoints: string[],
  options: TreeShakingOptions = {}
): TreeShakingResult => {
  const { symbolTable } = projectAnalysis;

  // 计算符号闭包
  const includedSymbols = calculateClosure(symbolTable, entryPoints);

  // 查找未使用的符号
  const unusedSymbols = findUnusedSymbols(symbolTable, Array.from(includedSymbols));

  // 按文件分组
  const includedByFile = groupSymbolsByFile(includedSymbols, symbolTable);
  const unusedByFile = groupSymbolsByFile(unusedSymbols, symbolTable);

  // 计算统计信息
  const statistics = calculateStatistics(symbolTable, includedSymbols, unusedSymbols);

  return {
    entryPoints,
    includedSymbols,
    unusedSymbols,
    includedByFile,
    unusedByFile,
    symbolTable,
    statistics
  };
};

export default performTreeShaking; 