import type { TreeShakingResult } from '../../lang/ProjectAnalyzer';
import type { ProjectSymbolTableState, SymbolInfo } from '../../lang/SymbolTable';
import { getSymbol, getAllFiles, getFileSymbols } from '../../lang/SymbolTable';

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
    const label = symbolName.split(':')[1]; // 只显示符号名，不显示文件路径
    
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
 * 生成依赖关系邻接表报告
 * @param result - Tree shaking分析结果
 * @returns 邻接表格式的依赖报告字符串
 */
export const generateAdjacencyListReport = (result: TreeShakingResult): string => {
  const lines: string[] = [];
  
  lines.push('依赖关系邻接表');
  lines.push('='.repeat(80));
  lines.push('');

  // 遍历所有符号
  result.includedSymbols.forEach(symbolName => {
    const symbolInfo = getSymbol(result.symbolTable, symbolName);
    if (!symbolInfo) return;
    
    // 获取符号的简短名称（不包含文件路径）
    const shortName = symbolName.split(':')[1];
    
    // 获取依赖的符号的简短名称
    const dependencies = Array.from(symbolInfo.dependencies)
      .map(dep => dep.split(':')[1])
      .sort();
    
    // 输出邻接表条目
    lines.push(`${shortName}:`);
    if (dependencies.length > 0) {
      dependencies.forEach(dep => {
        lines.push(`  - ${dep}`);
      });
    } else {
      lines.push('  (无依赖)');
    }
    lines.push('');
  });
  
  return lines.join('\n');
};
