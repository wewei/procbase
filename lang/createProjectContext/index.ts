import ts from 'typescript';
import type { ProjectAnalysisContext } from '../types/analysis/ProjectAnalysisContext';
import createProjectSymbolTable from '../createProjectSymbolTable';
import createProgram from '../analyzeProject/createProgram';
import createDefaultOptions from './createDefaultOptions';
import fromConfig from './fromConfig';
import fromFiles from './fromFiles';

/**
 * 创建项目分析上下文
 * @param rootFiles - 根文件列表
 * @param compilerOptions - 编译选项
 * @returns 项目分析上下文
 */
const createProjectContext = (
  rootFiles: string[],
  compilerOptions: ts.CompilerOptions = {}
): ProjectAnalysisContext => {
  const program = createProgram(rootFiles, compilerOptions);
  const typeChecker = program.getTypeChecker();
  const symbolTable = createProjectSymbolTable();
  
  return {
    program,
    typeChecker,
    symbolTable,
    rootFiles,
    compilerOptions
  };
};

export default createProjectContext;
export { fromConfig, fromFiles, createDefaultOptions }; 