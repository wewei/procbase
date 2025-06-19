import { describe, it, expect } from "bun:test";
import * as ts from 'typescript';
import { extractSymbolsFromFile } from '../SymbolExtractor';
import { createProjectSymbolTable, addFileSymbols, calculateClosure } from '../SymbolTable';

/**
 * 创建多文件的测试程序
 */
const createMultiFileTestProgram = (files: Record<string, string>): ts.Program => {
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

describe('Dependency Analysis', () => {
  describe('跨文件依赖关系', () => {
    it.skip('应该正确检测跨文件依赖', () => {
      // TODO: 需要真实文件系统支持才能正确测试跨文件依赖
      // 当前 in-memory 测试环境下，TypeScript 无法正确解析模块间的符号关联
      const files = {
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
      };

      const program = createMultiFileTestProgram(files);
      const typeChecker = program.getTypeChecker();
      const symbolTable = createProjectSymbolTable();

      // 分析所有文件
      Object.entries(files).forEach(([fileName, sourceCode]) => {
        const sourceFile = program.getSourceFile(fileName)!;
        const fileSymbols = extractSymbolsFromFile(sourceFile, typeChecker);
        
        addFileSymbols(symbolTable, {
          fileName,
          symbols: fileSymbols
        });
      });

      // 测试依赖关系
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
    });
  });

  describe('循环依赖', () => {
    it.skip('应该检测循环依赖', () => {
      // TODO: 需要真实文件系统支持才能正确测试跨文件依赖
      const files = {
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
      };

      const program = createMultiFileTestProgram(files);
      const typeChecker = program.getTypeChecker();
      const symbolTable = createProjectSymbolTable();

      // 分析所有文件
      Object.entries(files).forEach(([fileName, sourceCode]) => {
        const sourceFile = program.getSourceFile(fileName)!;
        const fileSymbols = extractSymbolsFromFile(sourceFile, typeChecker);
        
        addFileSymbols(symbolTable, {
          fileName,
          symbols: fileSymbols
        });
      });

      // 检查依赖关系
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
    });
  });

  describe('实际项目场景', () => {
    it.skip('应该正确处理复杂的依赖关系', () => {
      // TODO: 需要真实文件系统支持才能正确测试跨文件依赖
      const files = {
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
      };

      const program = createMultiFileTestProgram(files);
      const typeChecker = program.getTypeChecker();
      const symbolTable = createProjectSymbolTable();

      // 分析所有文件
      Object.entries(files).forEach(([fileName, sourceCode]) => {
        const sourceFile = program.getSourceFile(fileName)!;
        const fileSymbols = extractSymbolsFromFile(sourceFile, typeChecker);
        
        addFileSymbols(symbolTable, {
          fileName,
          symbols: fileSymbols
        });
      });

      // 测试从入口点开始的依赖分析
      const closure = calculateClosure(symbolTable, ['index.ts:main']);
      
      console.log(`从 main 函数开始的符号闭包大小: ${closure.size}`);
      console.log(`包含的符号: ${Array.from(closure).join(', ')}`);

      // 检查是否包含了所有必要的依赖
      const expectedSymbols = [
        'index.ts:main',
        'api.ts:fetchUser',
        'api.ts:processUser',
        'types.ts:User',
        'types.ts:ApiResponse',
        'utils.ts:validateRole',
        'utils.ts:formatUserName'
      ];

      expectedSymbols.forEach(symbol => {
        expect(closure.has(symbol)).toBe(true);
      });

      expect(closure.size).toBeGreaterThanOrEqual(expectedSymbols.length);
    });
  });
}); 