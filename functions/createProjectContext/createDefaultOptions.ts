import ts from 'typescript';

/**
 * 创建默认的编译选项
 * @returns 默认的TypeScript编译选项
 */
const createDefaultOptions = (): ts.CompilerOptions => ({
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Node16,
  strict: true,
  esModuleInterop: true,
  skipLibCheck: true,
  forceConsistentCasingInFileNames: true,
  declaration: true,
  declarationMap: true,
  sourceMap: true
});

export default createDefaultOptions; 