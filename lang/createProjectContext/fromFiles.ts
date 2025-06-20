import ts from 'typescript';
import type { ProjectAnalysisContext } from '../types';
import createProjectSymbolTable from '../createProjectSymbolTable';
import createProgram from '../analyzeProject/createProgram';

/**
 * 从文件列表创建项目分析上下文
 * @param files - 文件列表
 * @param options - 编译选项
 * @returns 项目分析上下文
 */
const fromFiles = (
  files: string[], 
  options: ts.CompilerOptions = {}
): ProjectAnalysisContext => {
  const program = createProgram(files, options);
  const typeChecker = program.getTypeChecker();
  const symbolTable = createProjectSymbolTable();
  
  return {
    program,
    typeChecker,
    symbolTable,
    rootFiles: files,
    compilerOptions: options
  };
};

export default fromFiles; 