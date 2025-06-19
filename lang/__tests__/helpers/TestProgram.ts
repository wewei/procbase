import * as ts from 'typescript';

/**
 * 创建单文件测试程序的配置选项
 */
export type SingleFileTestOptions = {
  sourceCode: string;
  fileName?: string;
};

/**
 * 创建多文件测试程序的配置选项
 */
export type MultiFileTestOptions = {
  files: Record<string, string>;
};

/**
 * 创建单文件测试用的 TypeScript 程序
 */
export const createSingleFileProgram = ({
  sourceCode,
  fileName = 'test.ts'
}: SingleFileTestOptions): ts.Program => {
  const compilerHost: ts.CompilerHost = {
    getSourceFile: (name: string) => {
      if (name === fileName) {
        return ts.createSourceFile(name, sourceCode, ts.ScriptTarget.ES2020);
      }
      return undefined;
    },
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getDirectories: () => [],
    fileExists: (name: string) => name === fileName,
    readFile: (name: string) => name === fileName ? sourceCode : undefined,
    getDefaultLibFileName: () => 'lib.d.ts',
    getCanonicalFileName: (name: string) => name,
    useCaseSensitiveFileNames: () => false,
    getNewLine: () => '\n',
    getEnvironmentVariable: () => undefined
  };

  return ts.createProgram([fileName], {}, compilerHost);
};

/**
 * 创建多文件测试用的 TypeScript 程序
 */
export const createMultiFileProgram = ({
  files
}: MultiFileTestOptions): ts.Program => {
  const compilerHost: ts.CompilerHost = {
    getSourceFile: (name: string) => {
      if (files[name]) {
        return ts.createSourceFile(name, files[name], ts.ScriptTarget.ES2020);
      }
      return undefined;
    },
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getDirectories: () => [],
    fileExists: (name: string) => files.hasOwnProperty(name),
    readFile: (name: string) => files[name],
    getDefaultLibFileName: () => 'lib.d.ts',
    getCanonicalFileName: (name: string) => name,
    useCaseSensitiveFileNames: () => false,
    getNewLine: () => '\n',
    getEnvironmentVariable: () => undefined
  };

  return ts.createProgram(Object.keys(files), {}, compilerHost);
}; 