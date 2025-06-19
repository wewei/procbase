import { describe, it, expect } from "bun:test";
import * as ts from 'typescript';
import { extractSymbolsFromFile } from '../SymbolExtractor';
import { createSingleFileProgram } from './helpers/TestProgram';

describe('Property Access Dependency Analysis', () => {
  it('应该只包含独立符号，不包含属性访问', () => {
    const sourceCode = `
      interface Point {
        x: number;
        y: number;
      }
      
      const point: Point = { x: 1, y: 2 };
      
      export function getX(p: Point): number {
        return p.x; // 这里 p.x 中的 x 不应该被包含为依赖
      }
      
      export function createPoint(): Point {
        return { x: 3, y: 4 };
      }
      
      export function usePoint() {
        const p = createPoint();
        return getX(p);
      }
    `;

    const program = createSingleFileProgram({ sourceCode });
    const typeChecker = program.getTypeChecker();
    const sourceFile = program.getSourceFile('test.ts')!;

    const result = extractSymbolsFromFile(sourceFile, typeChecker);

    // 验证导出的符号
    expect(result.exports.has('getX')).toBe(true);
    expect(result.exports.has('createPoint')).toBe(true);
    expect(result.exports.has('usePoint')).toBe(true);

    // 验证内部符号
    expect(result.internal.has('point')).toBe(true);

    // 获取符号的依赖关系
    const getXSymbol = result.exports.get('getX');
    const createPointSymbol = result.exports.get('createPoint');
    const usePointSymbol = result.exports.get('usePoint');

    expect(getXSymbol).toBeDefined();
    expect(createPointSymbol).toBeDefined();
    expect(usePointSymbol).toBeDefined();

    // 验证 getX 函数的依赖
    // getX 应该没有依赖，因为它只是访问属性，不依赖其他独立符号
    console.log('getX 的依赖:', Array.from(getXSymbol!.dependencies));
    expect(getXSymbol!.dependencies.size).toBe(0);

    // 验证 createPoint 函数的依赖
    // createPoint 应该没有依赖，因为它只是创建对象
    console.log('createPoint 的依赖:', Array.from(createPointSymbol!.dependencies));
    expect(createPointSymbol!.dependencies.size).toBe(0);

    // 验证 usePoint 函数的依赖
    // usePoint 应该依赖 createPoint 和 getX
    console.log('usePoint 的依赖:', Array.from(usePointSymbol!.dependencies));
    expect(usePointSymbol!.dependencies.size).toBe(2);
  });

  it('应该正确处理嵌套属性访问', () => {
    const sourceCode = `
      interface User {
        profile: {
          name: string;
          email: string;
        };
      }
      
      const user: User = {
        profile: {
          name: 'John',
          email: 'john@example.com'
        }
      };
      
      export function getUserName(u: User): string {
        return u.profile.name; // 这里 u.profile.name 中的 profile 和 name 都不应该被包含
      }
      
      export function getUserEmail(u: User): string {
        return u.profile.email; // 这里 u.profile.email 中的 profile 和 email 都不应该被包含
      }
    `;

    const program = createSingleFileProgram({ sourceCode });
    const typeChecker = program.getTypeChecker();
    const sourceFile = program.getSourceFile('test.ts')!;

    const result = extractSymbolsFromFile(sourceFile, typeChecker);

    // 验证导出的符号
    expect(result.exports.has('getUserName')).toBe(true);
    expect(result.exports.has('getUserEmail')).toBe(true);

    // 获取符号的依赖关系
    const getUserNameSymbol = result.exports.get('getUserName');
    const getUserEmailSymbol = result.exports.get('getUserEmail');

    expect(getUserNameSymbol).toBeDefined();
    expect(getUserEmailSymbol).toBeDefined();

    // 验证这些函数应该没有依赖，因为它们只是访问属性
    console.log('getUserName 的依赖:', Array.from(getUserNameSymbol!.dependencies));
    console.log('getUserEmail 的依赖:', Array.from(getUserEmailSymbol!.dependencies));
    
    expect(getUserNameSymbol!.dependencies.size).toBe(0);
    expect(getUserEmailSymbol!.dependencies.size).toBe(0);
  });

  it('应该包含独立符号的依赖', () => {
    const sourceCode = `
      export function helper(): string {
        return 'helper';
      }
      
      export function main(): string {
        return helper(); // 这里 helper 应该被包含为依赖
      }
      
      export const config = {
        apiUrl: 'https://api.example.com',
        timeout: 5000
      };
      
      export function getConfig() {
        return config; // 这里 config 应该被包含为依赖
      }
    `;

    const program = createSingleFileProgram({ sourceCode });
    const typeChecker = program.getTypeChecker();
    const sourceFile = program.getSourceFile('test.ts')!;

    const result = extractSymbolsFromFile(sourceFile, typeChecker);

    // 验证导出的符号
    expect(result.exports.has('helper')).toBe(true);
    expect(result.exports.has('main')).toBe(true);
    expect(result.exports.has('config')).toBe(true);
    expect(result.exports.has('getConfig')).toBe(true);

    // 获取符号的依赖关系
    const mainSymbol = result.exports.get('main');
    const getConfigSymbol = result.exports.get('getConfig');

    expect(mainSymbol).toBeDefined();
    expect(getConfigSymbol).toBeDefined();

    // 验证 main 函数依赖 helper
    console.log('main 的依赖:', Array.from(mainSymbol!.dependencies));
    expect(mainSymbol!.dependencies.size).toBe(1);
    expect(mainSymbol!.dependencies.has('test.ts:helper')).toBe(true);

    // 验证 getConfig 函数依赖 config
    console.log('getConfig 的依赖:', Array.from(getConfigSymbol!.dependencies));
    expect(getConfigSymbol!.dependencies.size).toBe(1);
    expect(getConfigSymbol!.dependencies.has('test.ts:config')).toBe(true);
  });
}); 