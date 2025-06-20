import type { ProjectAnalysisResult } from '../types/analysis/ProjectAnalysisResult';
import type { ProjectAnalysisContext } from '../types/analysis/ProjectAnalysisContext';
import type { AnalysisOptions } from '../types/analysis/AnalysisOptions';
import addFileSymbols from '../createProjectSymbolTable/addFileSymbols';
import getSourceFiles from './getSourceFiles';
import analyzeSourceFile from './analyzeSourceFile';
import calculateStatistics from './calculateStatistics';
import getDiagnostics from './getDiagnostics';

/**
 * 分析整个项目，构建符号表和依赖关系
 * @param context - 项目分析上下文
 * @param options - 分析选项
 * @returns 项目分析结果
 */
const analyzeProject = (
  context: ProjectAnalysisContext,
  options: AnalysisOptions = {}
): ProjectAnalysisResult => {
  const sourceFiles = getSourceFiles(context.program, context.rootFiles);
  
  sourceFiles.forEach(sourceFile => {
    const fileSymbols = analyzeSourceFile(sourceFile, context.typeChecker, options);
    addFileSymbols(context.symbolTable, fileSymbols);
  });
  
  const diagnostics = getDiagnostics(context.program);
  const statistics = calculateStatistics(context.symbolTable, context.rootFiles);

  return {
    symbolTable: context.symbolTable,
    rootFiles: context.rootFiles,
    compilerOptions: context.compilerOptions,
    diagnostics,
    statistics
  };
};

export default analyzeProject; 