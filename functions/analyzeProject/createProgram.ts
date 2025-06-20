import ts from 'typescript';

/**
 * 创建TypeScript程序
 * @param rootFiles - 根文件列表
 * @param compilerOptions - 编译选项
 * @returns TypeScript程序实例
 */
const createProgram = (
  rootFiles: string[], 
  compilerOptions: ts.CompilerOptions = {}
): ts.Program => {
  return ts.createProgram(rootFiles, compilerOptions);
};

export default createProgram; 