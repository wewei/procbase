import { describe, it, expect } from "bun:test";
import * as ts from 'typescript';
import { extractSymbolsFromFile } from '../SymbolExtractor';

/**
 * 创建测试用的 TypeScript 程序
 * @param sourceCode - 源代码
 * @param fileName - 文件名
 * @returns TypeScript 程序
 */
const createTestProgram = (sourceCode: string, fileName: string = 'test.ts'): ts.Program => {
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

describe('SymbolExtractor', () => {
  describe('extractSymbolsFromFile', () => {
    it('应该提取函数声明', () => {
      const sourceCode = `
        export function hello(name: string): string {
          return \`Hello \${name}!\`;
        }
        
        function internal(): void {
          console.log('internal');
        }
      `;

      const program = createTestProgram(sourceCode);
      const typeChecker = program.getTypeChecker();
      const sourceFile = program.getSourceFile('test.ts')!;

      const result = extractSymbolsFromFile(sourceFile, typeChecker);

      expect(result.exports.has('hello')).toBe(true);
      expect(result.internal.has('internal')).toBe(true);
      expect(result.exports.size).toBe(1);
      expect(result.internal.size).toBe(1);
    });

    it('应该提取类声明', () => {
      const sourceCode = `
        export class User {
          constructor(public name: string) {}
          
          greet(): string {
            return \`Hello \${this.name}!\`;
          }
        }
      `;

      const program = createTestProgram(sourceCode);
      const typeChecker = program.getTypeChecker();
      const sourceFile = program.getSourceFile('test.ts')!;

      const result = extractSymbolsFromFile(sourceFile, typeChecker);

      expect(result.exports.has('User')).toBe(true);
      expect(result.exports.size).toBe(1);
    });

    it('应该提取接口声明', () => {
      const sourceCode = `
        export interface Config {
          port: number;
          host: string;
        }
      `;

      const program = createTestProgram(sourceCode);
      const typeChecker = program.getTypeChecker();
      const sourceFile = program.getSourceFile('test.ts')!;

      const result = extractSymbolsFromFile(sourceFile, typeChecker);

      expect(result.exports.has('Config')).toBe(true);
      expect(result.exports.size).toBe(1);
    });

    it('应该提取类型别名', () => {
      const sourceCode = `
        export type Status = 'pending' | 'success' | 'error';
      `;

      const program = createTestProgram(sourceCode);
      const typeChecker = program.getTypeChecker();
      const sourceFile = program.getSourceFile('test.ts')!;

      const result = extractSymbolsFromFile(sourceFile, typeChecker);

      expect(result.exports.has('Status')).toBe(true);
      expect(result.exports.size).toBe(1);
    });

    it('应该提取变量声明', () => {
      const sourceCode = `
        export const API_URL = 'https://api.example.com';
        const INTERNAL_CONFIG = { timeout: 5000 };
      `;

      const program = createTestProgram(sourceCode);
      const typeChecker = program.getTypeChecker();
      const sourceFile = program.getSourceFile('test.ts')!;

      const result = extractSymbolsFromFile(sourceFile, typeChecker);

      expect(result.exports.has('API_URL')).toBe(true);
      expect(result.internal.has('INTERNAL_CONFIG')).toBe(true);
    });

    it('应该提取导入声明', () => {
      const sourceCode = `
        import { useState } from 'react';
        import * as utils from './utils';
        import defaultExport from './default';
      `;

      const program = createTestProgram(sourceCode);
      const typeChecker = program.getTypeChecker();
      const sourceFile = program.getSourceFile('test.ts')!;

      const result = extractSymbolsFromFile(sourceFile, typeChecker);

      expect(result.imports.has('useState')).toBe(true);
      expect(result.imports.has('utils')).toBe(true);
      expect(result.imports.has('defaultExport')).toBe(true);
      expect(result.imports.size).toBe(3);
    });

    it.skip('应该计算符号依赖关系', () => {
      // TODO: 需要真实文件系统支持才能正确测试跨文件依赖
      const sourceCode = `
        import { User } from './user';
        import { Config } from './config';
        
        export function createUser(config: Config): User {
          return new User(config.name);
        }
      `;

      const program = createTestProgram(sourceCode);
      const typeChecker = program.getTypeChecker();
      const sourceFile = program.getSourceFile('test.ts')!;

      const result = extractSymbolsFromFile(sourceFile, typeChecker);

      const createUserSymbol = result.exports.get('createUser');
      expect(createUserSymbol).toBeDefined();
      expect(createUserSymbol!.dependencies.size).toBeGreaterThan(0);
    });
  });
}); 