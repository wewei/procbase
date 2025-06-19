import { describe, it, expect } from "bun:test";
import * as ts from 'typescript';
import { extractSymbolsFromFile } from '../SymbolExtractor';
import { createProjectSymbolTable, addFileSymbols, calculateClosure } from '../SymbolTable';
import { createMultiFileProgram } from './helpers/TestProgram';

/**
 * 创建一个多文件测试用例
 */
type MultiFileTestCase = {
  name: string;
  files: Record<string, string>;
  assertions: (program: ts.Program, symbolTable: ReturnType<typeof createProjectSymbolTable>) => void;
};

/**
 * 运行多文件测试用例
 */
const runMultiFileTest = (testCase: MultiFileTestCase) => {
  const program = createMultiFileProgram({ files: testCase.files });
  const typeChecker = program.getTypeChecker();
  const symbolTable = createProjectSymbolTable();

  // 分析所有文件
  Object.entries(testCase.files).forEach(([fileName, _]) => {
    const sourceFile = program.getSourceFile(fileName)!;
    const fileSymbols = extractSymbolsFromFile(sourceFile, typeChecker);
    
    addFileSymbols(symbolTable, {
      fileName,
      symbols: fileSymbols
    });
  });

  testCase.assertions(program, symbolTable);
};

describe('Dependency Analysis', () => {
  describe('跨文件依赖关系', () => {
    const testCases: MultiFileTestCase[] = [
      {
        name: '应该正确检测跨文件依赖',
        files: {
          'user.ts': `
            export interface User {
              id: string;
              name: string;
            }
            
            export class UserService {
              getUser(id: string): User {
                return { id, name: 'Test User' };
              }
            }
          `,
          'config.ts': `
            export interface Config {
              apiUrl: string;
              timeout: number;
            }
            
            export const defaultConfig: Config = {
              apiUrl: 'https://api.example.com',
              timeout: 5000
            };
          `,
          'main.ts': `
            import { User, UserService } from './user.ts';
            import { Config, defaultConfig } from './config.ts';
            
            export function createUser(config: Config): User {
              const service = new UserService();
              return service.getUser('123');
            }
            
            export function getConfig(): Config {
              return defaultConfig;
            }
          `
        },
        assertions: (_, symbolTable) => {
          const mainSymbols = symbolTable.fileSymbols.get('main.ts');
          expect(mainSymbols).toBeDefined();

          const createUserSymbol = mainSymbols!.symbols.exports.get('createUser');
          expect(createUserSymbol).toBeDefined();

          // 检查依赖关系
          const dependencies = Array.from(createUserSymbol!.dependencies);
          console.log(`createUser 的依赖: ${dependencies.join(', ')}`);

          // 测试符号闭包计算
          const closure = calculateClosure(symbolTable, ['main.ts:createUser']);
          console.log(`符号闭包大小: ${closure.size}`);
          console.log(`闭包内容: ${Array.from(closure).join(', ')}`);

          // 验证闭包包含必要的符号
          expect(closure.has('main.ts:createUser')).toBe(true);
          expect(closure.size).toBeGreaterThan(1);
        }
      }
    ];

    testCases.forEach(testCase => {
      it(testCase.name, () => runMultiFileTest(testCase));
    });
  });

  describe('循环依赖', () => {
    const testCases: MultiFileTestCase[] = [
      {
        name: '应该检测循环依赖',
        files: {
          'a.ts': `
            import { b } from './b.ts';
            
            export function a(): string {
              return 'a' + b();
            }
          `,
          'b.ts': `
            import { a } from './a.ts';
            
            export function b(): string {
              return 'b' + a();
            }
          `
        },
        assertions: (_, symbolTable) => {
          const aSymbols = symbolTable.fileSymbols.get('a.ts');
          const bSymbols = symbolTable.fileSymbols.get('b.ts');

          expect(aSymbols).toBeDefined();
          expect(bSymbols).toBeDefined();

          const aFunction = aSymbols!.symbols.exports.get('a');
          const bFunction = bSymbols!.symbols.exports.get('b');

          expect(aFunction).toBeDefined();
          expect(bFunction).toBeDefined();

          console.log(`a 函数的依赖: ${Array.from(aFunction!.dependencies).join(', ')}`);
          console.log(`b 函数的依赖: ${Array.from(bFunction!.dependencies).join(', ')}`);

          // 验证存在循环依赖
          expect(aFunction!.dependencies.size).toBeGreaterThan(0);
          expect(bFunction!.dependencies.size).toBeGreaterThan(0);
        }
      }
    ];

    testCases.forEach(testCase => {
      it(testCase.name, () => runMultiFileTest(testCase));
    });
  });

  describe('实际项目场景', () => {
    const testCases: MultiFileTestCase[] = [
      {
        name: '应该正确处理复杂的依赖关系',
        files: {
          'types.ts': `
            export type UserRole = 'admin' | 'user' | 'guest';
            
            export interface User {
              id: string;
              name: string;
              role: UserRole;
            }
            
            export interface ApiResponse<T> {
              data: T;
              status: 'success' | 'error';
              message?: string;
            }
          `,
          'utils.ts': `
            import { UserRole } from './types.ts';
            
            export function validateRole(role: UserRole): boolean {
              return ['admin', 'user', 'guest'].includes(role);
            }
            
            export function formatUserName(name: string): string {
              return name.trim().toUpperCase();
            }
          `,
          'api.ts': `
            import { User, ApiResponse } from './types.ts';
            import { validateRole, formatUserName } from './utils.ts';
            
            export async function fetchUser(id: string): Promise<ApiResponse<User>> {
              // 模拟 API 调用
              return {
                data: { id, name: 'John Doe', role: 'user' },
                status: 'success'
              };
            }
            
            export function processUser(user: User): User {
              if (!validateRole(user.role)) {
                throw new Error('Invalid role');
              }
              
              return {
                ...user,
                name: formatUserName(user.name)
              };
            }
          `,
          'index.ts': `
            import { fetchUser, processUser } from './api.ts';
            import { User } from './types.ts';
            
            export async function main(): Promise<void> {
              const response = await fetchUser('123');
              if (response.status === 'success') {
                const processedUser = processUser(response.data);
                console.log('Processed user:', processedUser);
              }
            }
          `
        },
        assertions: (_, symbolTable) => {
          // 验证类型定义
          const typesSymbols = symbolTable.fileSymbols.get('types.ts');
          expect(typesSymbols).toBeDefined();
          expect(typesSymbols!.symbols.exports.has('UserRole')).toBe(true);
          expect(typesSymbols!.symbols.exports.has('User')).toBe(true);
          expect(typesSymbols!.symbols.exports.has('ApiResponse')).toBe(true);

          // 验证工具函数
          const utilsSymbols = symbolTable.fileSymbols.get('utils.ts');
          expect(utilsSymbols).toBeDefined();
          expect(utilsSymbols!.symbols.exports.has('validateRole')).toBe(true);
          expect(utilsSymbols!.symbols.exports.has('formatUserName')).toBe(true);

          // 验证 API 函数
          const apiSymbols = symbolTable.fileSymbols.get('api.ts');
          expect(apiSymbols).toBeDefined();
          expect(apiSymbols!.symbols.exports.has('fetchUser')).toBe(true);
          expect(apiSymbols!.symbols.exports.has('processUser')).toBe(true);

          // 验证主函数
          const indexSymbols = symbolTable.fileSymbols.get('index.ts');
          expect(indexSymbols).toBeDefined();
          expect(indexSymbols!.symbols.exports.has('main')).toBe(true);

          // 验证依赖关系
          const mainSymbol = indexSymbols!.symbols.exports.get('main');
          expect(mainSymbol).toBeDefined();
          expect(mainSymbol!.dependencies.size).toBeGreaterThan(0);

          // 计算主函数的依赖闭包
          const closure = calculateClosure(symbolTable, ['index.ts:main']);
          console.log(`主函数依赖闭包大小: ${closure.size}`);
          console.log(`闭包内容: ${Array.from(closure).join(', ')}`);

          // 验证闭包包含所有必要的依赖
          expect(closure.has('index.ts:main')).toBe(true);
          expect(closure.has('api.ts:fetchUser')).toBe(true);
          expect(closure.has('api.ts:processUser')).toBe(true);
          expect(closure.size).toBeGreaterThan(5);
        }
      }
    ];

    testCases.forEach(testCase => {
      it(testCase.name, () => runMultiFileTest(testCase));
    });
  });
}); 