import ts from 'typescript';

/**
 * 获取项目中的源文件
 * @param program - TypeScript程序
 * @param rootFiles - 根文件列表
 * @returns 过滤后的源文件列表
 */
const getSourceFiles = (
  program: ts.Program, 
  rootFiles: string[]
): ts.SourceFile[] => {
  return program.getSourceFiles()
    .filter(sf => !sf.isDeclarationFile && rootFiles.includes(sf.fileName));
};

export default getSourceFiles; 