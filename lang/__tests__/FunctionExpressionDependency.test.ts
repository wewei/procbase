import { describe, it, expect } from "bun:test";
import * as ts from 'typescript';
import extractSymbolsFromFile from '../extractSymbols';
import { createProjectSymbolTable, addFileSymbols } from '../index';
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

describe('Function Expression Dependencies', () => {
  describe('箭头函数依赖', () => {
    const testCases: MultiFileTestCase[] = [
      {
        name: '应该正确分析箭头函数中的依赖',
        files: {
          'utils.ts': `
            export const add = (a: number, b: number) => a + b;
            export const multiply = (a: number, b: number) => a * b;
          `,
          'math.ts': `
            import { add, multiply } from './utils.ts';
            
            // 箭头函数使用外部依赖
            export const calculate = (x: number, y: number) => {
              const sum = add(x, y);
              const product = multiply(x, y);
              return { sum, product };
            };

            // 箭头函数使用内部函数
            export const processNumbers = (numbers: number[]) => {
              const square = (n: number) => n * n;
              return numbers.map(square);
            };
          `
        },
        assertions: (_, symbolTable) => {
          const mathSymbols = symbolTable.fileSymbols.get('math.ts');
          expect(mathSymbols).toBeDefined();

          // 测试 calculate 函数的依赖
          const calculateSymbol = mathSymbols!.symbols.exports.get('calculate');
          expect(calculateSymbol).toBeDefined();
          const calculateDeps = Array.from(calculateSymbol!.dependencies);
          expect(calculateDeps).toContain('utils.ts:add');
          expect(calculateDeps).toContain('utils.ts:multiply');

          // 测试 processNumbers 函数的依赖
          const processNumbersSymbol = mathSymbols!.symbols.exports.get('processNumbers');
          expect(processNumbersSymbol).toBeDefined();
          const processNumbersDeps = Array.from(processNumbersSymbol!.dependencies);
          console.log('processNumbers dependencies:', processNumbersDeps);
          expect(processNumbersDeps.length).toBe(0); // 不应该有外部依赖
        }
      }
    ];

    testCases.forEach(testCase => {
      it(testCase.name, () => runMultiFileTest(testCase));
    });
  });

  describe('函数表达式依赖', () => {
    const testCases: MultiFileTestCase[] = [
      {
        name: '应该正确分析函数表达式中的依赖',
        files: {
          'logger.ts': `
            export const log = (message: string) => console.log(message);
          `,
          'service.ts': `
            import { log } from './logger.ts';
            
            // 普通函数表达式使用外部依赖
            export const createService = function(name: string) {
              log(\`Creating service: \${name}\`);
              return {
                start: function() {
                  log(\`Starting service: \${name}\`);
                },
                stop: function() {
                  log(\`Stopping service: \${name}\`);
                }
              };
            };

            // 函数表达式使用其他函数表达式
            export const processData = function(data: any) {
              const validate = function(input: any) {
                return input != null;
              };
              
              if (validate(data)) {
                log('Data is valid');
                return data;
              }
              return null;
            };
          `
        },
        assertions: (_, symbolTable) => {
          const serviceSymbols = symbolTable.fileSymbols.get('service.ts');
          expect(serviceSymbols).toBeDefined();

          // 测试 createService 函数的依赖
          const createServiceSymbol = serviceSymbols!.symbols.exports.get('createService');
          expect(createServiceSymbol).toBeDefined();
          const createServiceDeps = Array.from(createServiceSymbol!.dependencies);
          expect(createServiceDeps).toContain('logger.ts:log');

          // 测试 processData 函数的依赖
          const processDataSymbol = serviceSymbols!.symbols.exports.get('processData');
          expect(processDataSymbol).toBeDefined();
          const processDataDeps = Array.from(processDataSymbol!.dependencies);
          expect(processDataDeps).toContain('logger.ts:log');
        }
      }
    ];

    testCases.forEach(testCase => {
      it(testCase.name, () => runMultiFileTest(testCase));
    });
  });

  describe('混合函数定义', () => {
    const testCases: MultiFileTestCase[] = [
      {
        name: '应该正确分析混合函数定义中的依赖',
        files: {
          'helpers.ts': `
            export function helper1(x: number) { return x * 2; }
            export const helper2 = (x: number) => x * 3;
            export const helper3 = function(x: number) { return x * 4; };
          `,
          'main.ts': `
            import { helper1, helper2, helper3 } from './helpers.ts';
            
            // 普通函数声明
            export function process1(x: number) {
              return helper1(x);
            }
            
            // 箭头函数
            export const process2 = (x: number) => {
              return helper2(x);
            };
            
            // 函数表达式
            export const process3 = function(x: number) {
              return helper3(x);
            };
            
            // 混合使用
            export const complexProcess = (x: number) => {
              const result1 = process1(x);
              const result2 = process2(x);
              const result3 = process3(x);
              return result1 + result2 + result3;
            };
          `
        },
        assertions: (_, symbolTable) => {
          const mainSymbols = symbolTable.fileSymbols.get('main.ts');
          expect(mainSymbols).toBeDefined();

          // 测试各种函数定义的依赖
          const process1Symbol = mainSymbols!.symbols.exports.get('process1');
          const process2Symbol = mainSymbols!.symbols.exports.get('process2');
          const process3Symbol = mainSymbols!.symbols.exports.get('process3');
          const complexProcessSymbol = mainSymbols!.symbols.exports.get('complexProcess');

          expect(process1Symbol).toBeDefined();
          expect(process2Symbol).toBeDefined();
          expect(process3Symbol).toBeDefined();
          expect(complexProcessSymbol).toBeDefined();

          // 检查依赖
          expect(Array.from(process1Symbol!.dependencies)).toContain('helpers.ts:helper1');
          expect(Array.from(process2Symbol!.dependencies)).toContain('helpers.ts:helper2');
          expect(Array.from(process3Symbol!.dependencies)).toContain('helpers.ts:helper3');

          const complexProcessDeps = Array.from(complexProcessSymbol!.dependencies);
          expect(complexProcessDeps).toContain('main.ts:process1');
          expect(complexProcessDeps).toContain('main.ts:process2');
          expect(complexProcessDeps).toContain('main.ts:process3');
        }
      }
    ];

    testCases.forEach(testCase => {
      it(testCase.name, () => runMultiFileTest(testCase));
    });
  });
}); 