import type { TreeShakingResult } from '../../lang/types/tree-shaking/TreeShakingResult';
import type { ProjectSymbolTableState } from '../../lang/types/project/ProjectSymbolTableState';
import type { SymbolInfo } from '../../lang/types/project/SymbolInfo';
import getSymbol from '../../lang/createProjectSymbolTable/getSymbol';
import getAllFiles from '../../lang/createProjectSymbolTable/getAllFiles';
import getFileSymbols from '../../lang/createProjectSymbolTable/getFileSymbols';

/**
 * 依赖图选项
 */
export type DependencyGraphOptions = {
  includedOnly?: boolean;
  maxNodes?: number;
  showTypes?: boolean;
};

/**
 * 影响分析结果
 */
export type ImpactAnalysis = {
  targetSymbol: string;
  directDependents: string[];
  allDependents: string[];
  impactCount: number;
};

/**
 * 从符号全名中提取符号名称（不包含文件路径）
 * @param fullSymbolName - 完整的符号名称（格式：file:path:symbol）
 * @returns 符号名称
 */
const extractSymbolName = (fullSymbolName: string): string => {
  const lastColonIndex = fullSymbolName.lastIndexOf(':');
  return lastColonIndex !== -1 ? fullSymbolName.slice(lastColonIndex + 1) : fullSymbolName;
};

/**
 * 生成详细报告
 * @param result - Tree shaking分析结果
 * @returns 详细报告字符串
 */
export const generateDetailedReport = (result: TreeShakingResult): string => {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('Tree Shaking 分析报告');
  lines.push('='.repeat(80));
  lines.push('');
  
  // 统计信息
  lines.push('📊 统计信息:');
  lines.push(`  总符号数: ${result.statistics.totalSymbols}`);
  lines.push(`  保留符号数: ${result.statistics.includedSymbols}`);
  lines.push(`  移除符号数: ${result.statistics.unusedSymbols}`);
  lines.push(`  移除率: ${result.statistics.removalRate}%`);
  lines.push('');
  
  // 入口点
  lines.push('🚀 入口点:');
  result.entryPoints.forEach(entry => {
    lines.push(`  - ${entry}`);
  });
  lines.push('');
  
  // 保留的符号（按文件分组）
  lines.push('✅ 保留的符号:');
  result.includedByFile.forEach((symbols, fileName) => {
    lines.push(`  📁 ${fileName}:`);
    symbols.forEach(symbol => {
      const fullName = `${fileName}:${symbol}`;
      const symbolInfo = getSymbol(result.symbolTable, fullName);
      const typeInfo = symbolInfo ? ` (${symbolInfo.type})` : '';
      lines.push(`    - ${symbol}${typeInfo}`);
    });
    lines.push('');
  });
  
  // 未使用的符号（按文件分组）
  lines.push('❌ 未使用的符号:');
  result.unusedByFile.forEach((symbols, fileName) => {
    lines.push(`  📁 ${fileName}:`);
    symbols.forEach(symbol => {
      const fullName = `${fileName}:${symbol}`;
      const symbolInfo = getSymbol(result.symbolTable, fullName);
      const typeInfo = symbolInfo ? ` (${symbolInfo.type})` : '';
      lines.push(`    - ${symbol}${typeInfo}`);
    });
    lines.push('');
  });
  
  return lines.join('\n');
};

/**
 * 生成简单报告
 * @param result - Tree shaking分析结果
 * @returns 摘要报告字符串
 */
export const generateSummaryReport = (result: TreeShakingResult): string => {
  const lines: string[] = [];
  
  lines.push('Tree Shaking 摘要报告');
  lines.push('-'.repeat(40));
  lines.push(`总符号数: ${result.statistics.totalSymbols}`);
  lines.push(`保留: ${result.statistics.includedSymbols} (${(100 - result.statistics.removalRate).toFixed(1)}%)`);
  lines.push(`移除: ${result.statistics.unusedSymbols} (${result.statistics.removalRate}%)`);
  
  return lines.join('\n');
};

/**
 * 生成JSON报告
 * @param result - Tree shaking分析结果
 * @returns JSON格式的报告字符串
 */
export const generateJSONReport = (result: TreeShakingResult): string => {
  const report = {
    timestamp: new Date().toISOString(),
    entryPoints: result.entryPoints,
    statistics: result.statistics,
    includedSymbols: Array.from(result.includedSymbols),
    unusedSymbols: Array.from(result.unusedSymbols),
    fileAnalysis: {} as Record<string, any>
  };

  // 添加文件级别的分析
  getAllFiles(result.symbolTable).forEach(fileName => {
    const fileSymbols = getFileSymbols(result.symbolTable, fileName);
    if (fileSymbols) {
      const totalInFile = fileSymbols.symbols.exports.size + fileSymbols.symbols.internal.size;
      const includedInFile = result.includedByFile.get(fileName)?.length || 0;
      const unusedInFile = result.unusedByFile.get(fileName)?.length || 0;
      
      report.fileAnalysis[fileName] = {
        totalSymbols: totalInFile,
        includedSymbols: includedInFile,
        unusedSymbols: unusedInFile,
        removalRate: totalInFile > 0 ? ((unusedInFile / totalInFile) * 100).toFixed(1) : '0'
      };
    }
  });

  return JSON.stringify(report, null, 2);
};

/**
 * 生成依赖关系图（DOT格式）
 * @param result - Tree shaking分析结果
 * @param options - 依赖图选项
 * @returns DOT格式的依赖图字符串
 */
export const generateDependencyGraph = (
  result: TreeShakingResult, 
  options: DependencyGraphOptions = {}
): string => {
  const lines: string[] = [];
  const includedOnly = options.includedOnly !== false;
  const maxNodes = options.maxNodes || 100;
  
  lines.push('digraph Dependencies {');
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=box, style=filled];');
  lines.push('');
  
  const symbolsToShow = includedOnly ? result.includedSymbols : new Set([
    ...Array.from(result.includedSymbols),
    ...Array.from(result.unusedSymbols)
  ]);

  let nodeCount = 0;
  symbolsToShow.forEach(symbolName => {
    if (nodeCount >= maxNodes) return;
    
    const symbolInfo = getSymbol(result.symbolTable, symbolName);
    if (!symbolInfo) return;
    
    const isIncluded = result.includedSymbols.has(symbolName);
    const color = isIncluded ? 'lightgreen' : 'lightcoral';
    const label = extractSymbolName(symbolName); // 使用新的提取函数
    
    lines.push(`  "${symbolName}" [label="${label}", fillcolor=${color}];`);
    
    // 添加依赖关系
    symbolInfo.dependencies.forEach(dep => {
      if (symbolsToShow.has(dep)) {
        lines.push(`  "${symbolName}" -> "${dep}";`);
      }
    });
    
    nodeCount++;
  });
  
  lines.push('}');
  return lines.join('\n');
};

/**
 * 生成Markdown报告
 * @param result - Tree shaking分析结果
 * @returns Markdown格式的报告字符串
 */
export const generateMarkdownReport = (result: TreeShakingResult): string => {
  const lines: string[] = [];
  
  lines.push('# Tree Shaking 分析报告');
  lines.push('');
  lines.push(`生成时间: ${new Date().toLocaleString()}`);
  lines.push('');
  
  // 统计信息表格
  lines.push('## 📊 统计信息');
  lines.push('');
  lines.push('| 指标 | 数量 | 百分比 |');
  lines.push('|------|------|---------|');
  lines.push(`| 总符号数 | ${result.statistics.totalSymbols} | 100% |`);
  lines.push(`| 保留符号 | ${result.statistics.includedSymbols} | ${(100 - result.statistics.removalRate).toFixed(1)}% |`);
  lines.push(`| 移除符号 | ${result.statistics.unusedSymbols} | ${result.statistics.removalRate}% |`);
  lines.push('');
  
  // 入口点
  lines.push('## 🚀 入口点');
  lines.push('');
  result.entryPoints.forEach(entry => {
    lines.push(`- \`${entry}\``);
  });
  lines.push('');
  
  // 文件级别分析
  lines.push('## 📁 文件级别分析');
  lines.push('');
  lines.push('| 文件 | 总符号 | 保留 | 移除 | 移除率 |');
  lines.push('|------|---------|------|------|---------|');
  
  getAllFiles(result.symbolTable).forEach(fileName => {
    const fileSymbols = getFileSymbols(result.symbolTable, fileName);
    if (fileSymbols) {
      const totalInFile = fileSymbols.symbols.exports.size + fileSymbols.symbols.internal.size;
      const includedInFile = result.includedByFile.get(fileName)?.length || 0;
      const unusedInFile = result.unusedByFile.get(fileName)?.length || 0;
      const removalRate = totalInFile > 0 ? ((unusedInFile / totalInFile) * 100).toFixed(1) : '0';
      
      lines.push(`| \`${fileName}\` | ${totalInFile} | ${includedInFile} | ${unusedInFile} | ${removalRate}% |`);
    }
  });
  
  lines.push('');
  
  // 保留的符号详情
  lines.push('## ✅ 保留的符号');
  lines.push('');
  result.includedByFile.forEach((symbols, fileName) => {
    lines.push(`### 📁 ${fileName}`);
    lines.push('');
    symbols.forEach(symbol => {
      const fullName = `${fileName}:${symbol}`;
      const symbolInfo = getSymbol(result.symbolTable, fullName);
      const typeInfo = symbolInfo ? ` (${symbolInfo.type})` : '';
      lines.push(`- \`${symbol}\`${typeInfo}`);
    });
    lines.push('');
  });
  
  // 未使用的符号详情
  lines.push('## ❌ 未使用的符号');
  lines.push('');
  result.unusedByFile.forEach((symbols, fileName) => {
    lines.push(`### 📁 ${fileName}`);
    lines.push('');
    symbols.forEach(symbol => {
      const fullName = `${fileName}:${symbol}`;
      const symbolInfo = getSymbol(result.symbolTable, fullName);
      const typeInfo = symbolInfo ? ` (${symbolInfo.type})` : '';
      lines.push(`- \`${symbol}\`${typeInfo}`);
    });
    lines.push('');
  });
  
  return lines.join('\n');
};

/**
 * 查找循环依赖
 * @param symbolTable - 符号表
 * @returns 循环依赖路径数组
 */
export const findCircularDependencies = (symbolTable: ProjectSymbolTableState): string[][] => {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  const dfs = (symbol: string, path: string[]): void => {
    if (recursionStack.has(symbol)) {
      const cycleStart = path.indexOf(symbol);
      if (cycleStart !== -1) {
        cycles.push([...path.slice(cycleStart), symbol]);
      }
      return;
    }
    
    if (visited.has(symbol)) {
      return;
    }
    
    visited.add(symbol);
    recursionStack.add(symbol);
    
    const dependencies = symbolTable.dependencies.get(symbol) || new Set();
    dependencies.forEach(dep => {
      dfs(dep, [...path, symbol]);
    });
    
    recursionStack.delete(symbol);
  };
  
  const allSymbols = Array.from(symbolTable.globalSymbols.keys());
  allSymbols.forEach(symbol => {
    if (!visited.has(symbol)) {
      dfs(symbol, []);
    }
  });
  
  return cycles;
};

/**
 * 计算影响分析
 * @param symbolName - 目标符号名
 * @param symbolTable - 符号表
 * @returns 影响分析结果
 */
export const calculateImpactAnalysis = (
  symbolName: string, 
  symbolTable: ProjectSymbolTableState
): ImpactAnalysis => {
  const directDependents = Array.from(symbolTable.reverseDependencies.get(symbolName) || new Set()) as string[];
  const allDependents = new Set<string>();
  
  const collectDependents = (symbol: string) => {
    allDependents.add(symbol);
    const dependents = symbolTable.reverseDependencies.get(symbol) || new Set();
    dependents.forEach(dep => {
      if (!allDependents.has(dep)) {
        collectDependents(dep);
      }
    });
  };
  
  collectDependents(symbolName);
  
  return {
    targetSymbol: symbolName,
    directDependents,
    allDependents: Array.from(allDependents),
    impactCount: allDependents.size
  };
};

/**
 * 查找最大的符号（按依赖数量排序）
 * @param symbolTable - 符号表
 * @param limit - 返回的符号数量限制
 * @returns 符号和依赖数量的数组
 */
export const findLargestSymbols = (
  symbolTable: ProjectSymbolTableState, 
  limit: number = 10
): Array<{ symbol: string; dependencyCount: number }> => {
  const symbolSizes = Array.from(symbolTable.globalSymbols.keys()).map(symbol => ({
    symbol,
    dependencyCount: symbolTable.dependencies.get(symbol)?.size || 0
  }));
  
  return symbolSizes
    .sort((a, b) => b.dependencyCount - a.dependencyCount)
    .slice(0, limit);
};

/**
 * 格式化符号位置信息
 * @param symbolInfo - 符号信息
 * @returns 格式化的位置信息字符串
 */
const formatSymbolLocation = (symbolInfo: SymbolInfo | undefined): string => {
  if (!symbolInfo || !symbolInfo.sourceLocation) return '';
  const { fileName } = symbolInfo;
  const { line } = symbolInfo.sourceLocation;
  return ` (${fileName}:${line})`;
};

/**
 * 生成依赖关系邻接表报告
 * @param result - Tree shaking分析结果
 * @returns 邻接表格式的依赖报告字符串
 */
export const generateAdjacencyListReport = (result: TreeShakingResult): string => {
  const lines: string[] = [];
  const processedSymbols = new Set<string>();
  
  lines.push('依赖关系邻接表');
  lines.push('='.repeat(80));
  lines.push('');

  // 处理一个符号及其所有依赖
  const processSymbol = (symbolName: string, indent: string = '') => {
    const symbolInfo = getSymbol(result.symbolTable, symbolName);
    if (!symbolInfo) return;

    // 获取符号的简短名称和位置信息
    const shortName = extractSymbolName(symbolName);
    const location = formatSymbolLocation(symbolInfo);
    
    // 输出当前符号
    lines.push(`${indent}${shortName}${location}`);
    
    // 如果已经处理过这个符号，不再展开其依赖
    if (processedSymbols.has(symbolName)) {
      return;
    }
    processedSymbols.add(symbolName);
    
    // 获取并排序依赖
    const dependencies = Array.from(symbolInfo.dependencies).sort();
    
    if (dependencies.length > 0) {
      // 递归处理每个依赖
      dependencies.forEach(dep => {
        processSymbol(dep, `${indent}  `);
      });
    } else {
      lines.push(`${indent}  (无依赖)`);
    }
    
    if (indent === '') {  // 只在顶层符号后添加空行
      lines.push('');
    }
  };

  // 首先处理所有包含的符号
  const allSymbols = new Set([
    ...Array.from(result.includedSymbols),
    ...Array.from(result.unusedSymbols)
  ]);

  // 按符号名称排序处理所有符号
  Array.from(allSymbols)
    .sort((a, b) => extractSymbolName(a).localeCompare(extractSymbolName(b)))
    .forEach(symbolName => {
      processSymbol(symbolName);
    });
  
  return lines.join('\n');
};
