import { describe, it, expect } from "bun:test";
import * as ts from 'typescript';
import { extractSymbolsFromFile } from '../SymbolExtractor';
import { createSingleFileProgram } from './helpers/TestProgram';

/**
 * 创建一个测试用例
 */
type TestCase = {
  name: string;
  sourceCode: string;
  assertions: (result: ReturnType<typeof extractSymbolsFromFile>) => void;
};

/**
 * 运行单个测试用例
 */
const runTestCase = (testCase: TestCase) => {
  const program = createSingleFileProgram({ sourceCode: testCase.sourceCode });
  const typeChecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile('test.ts')!;
  const result = extractSymbolsFromFile(sourceFile, typeChecker);
  testCase.assertions(result);
};

describe('SymbolExtractor', () => {
  describe('extractSymbolsFromFile', () => {
    const testCases: TestCase[] = [
      {
        name: '应该提取函数声明',
        sourceCode: `
          export function hello(name: string): string {
            return \`Hello \${name}!\`;
          }
          
          function internal(): void {
            console.log('internal');
          }
        `,
        assertions: (result) => {
          expect(result.exports.has('hello')).toBe(true);
          expect(result.internal.has('internal')).toBe(true);
          expect(result.exports.size).toBe(1);
          expect(result.internal.size).toBe(1);
        }
      },
      {
        name: '应该提取类声明',
        sourceCode: `
          export class User {
            constructor(public name: string) {}
            
            greet(): string {
              return \`Hello \${this.name}!\`;
            }
          }
        `,
        assertions: (result) => {
          expect(result.exports.has('User')).toBe(true);
          expect(result.exports.size).toBe(1);
        }
      },
      {
        name: '应该提取接口声明',
        sourceCode: `
          export interface Config {
            port: number;
            host: string;
          }
        `,
        assertions: (result) => {
          expect(result.exports.has('Config')).toBe(true);
          expect(result.exports.size).toBe(1);
        }
      },
      {
        name: '应该提取类型别名',
        sourceCode: `
          export type Status = 'pending' | 'success' | 'error';
        `,
        assertions: (result) => {
          expect(result.exports.has('Status')).toBe(true);
          expect(result.exports.size).toBe(1);
        }
      },
      {
        name: '应该提取变量声明',
        sourceCode: `
          export const API_URL = 'https://api.example.com';
          const INTERNAL_CONFIG = { timeout: 5000 };
        `,
        assertions: (result) => {
          expect(result.exports.has('API_URL')).toBe(true);
          expect(result.internal.has('INTERNAL_CONFIG')).toBe(true);
        }
      },
      {
        name: '应该提取导入声明',
        sourceCode: `
          import { useState } from 'react';
          import * as utils from './utils';
          import defaultExport from './default';
        `,
        assertions: (result) => {
          expect(result.imports.has('useState')).toBe(true);
          expect(result.imports.has('utils')).toBe(true);
          expect(result.imports.has('defaultExport')).toBe(true);
          expect(result.imports.size).toBe(3);
        }
      }
    ];

    testCases.forEach(testCase => {
      it(testCase.name, () => runTestCase(testCase));
    });
  });
}); 