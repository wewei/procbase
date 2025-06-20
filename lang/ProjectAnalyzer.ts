import ts from 'typescript';
import path from 'path';
import { extractSymbolsFromFile } from './SymbolExtractor';
import type { FileSymbols } from './SymbolTable';
import { createProjectSymbolTable, addFileSymbols, calculateClosure, findUnusedSymbols, getAllSymbols } from './SymbolTable';

/**
 * Tree shaking 结果
 */
export type TreeShakingResult = {
  entryPoints: string[];
  includedSymbols: Set<string>;
  unusedSymbols: Set<string>;
  includedByFile: Map<string, string[]>;
  unusedByFile: Map<string, string[]>;
  symbolTable: ReturnType<typeof createProjectSymbolTable>;
  statistics: TreeShakingStatistics;
};

/**
 * Tree shaking 统计信息
 */
export type TreeShakingStatistics = {
  totalSymbols: number;
  includedSymbols: number;
  unusedSymbols: number;
  removalRate: number; // 移除率百分比
};

/**
 * 分析选项
 */
export type AnalysisOptions = {
  includeDeclarationFiles?: boolean;
  includeNodeModules?: boolean;
  includeSystemSymbols?: boolean;
  followTypeOnlyImports?: boolean;
  maxDepth?: number;
};

/**
 * 项目分析上下文
 */
export type ProjectAnalysisContext = {
  program: ts.Program;
  typeChecker: ts.TypeChecker;
  symbolTable: ReturnType<typeof createProjectSymbolTable>;
  rootFiles: string[];
  compilerOptions: ts.CompilerOptions;
};

/**
 * 创建默认的编译选项
 * @returns 默认的TypeScript编译选项
 */
export const createDefaultCompilerOptions = (): ts.CompilerOptions => ({
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

/**
 * 创建TypeScript程序
 * @param rootFiles - 根文件列表
 * @param compilerOptions - 编译选项
 * @returns TypeScript程序实例
 */
export const createProgram = (
  rootFiles: string[], 
  compilerOptions: ts.CompilerOptions = {}
): ts.Program => {
  return ts.createProgram(rootFiles, compilerOptions);
};

/**
 * 获取项目中的源文件
 * @param program - TypeScript程序
 * @param rootFiles - 根文件列表
 * @returns 过滤后的源文件列表
 */
export const getSourceFiles = (
  program: ts.Program, 
  rootFiles: string[]
): ts.SourceFile[] => {
  return program.getSourceFiles()
    .filter(sf => !sf.isDeclarationFile && rootFiles.includes(sf.fileName));
};

/**
 * 分析单个源文件
 * @param sourceFile - 源文件
 * @param typeChecker - 类型检查器
 * @param options - 分析选项
 * @returns 文件符号信息
 */
export const analyzeSourceFile = (
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  options: AnalysisOptions = {}
): FileSymbols => {
  console.log(`正在分析文件: ${sourceFile.fileName}`);
  const symbols = extractSymbolsFromFile(sourceFile, typeChecker, {
    includeNodeModules: options.includeNodeModules ?? false,
    includeSystemSymbols: options.includeSystemSymbols ?? false
  });
  
  return {
    fileName: sourceFile.fileName,
    symbols
  };
};

/**
 * 分析整个项目
 * @param context - 项目分析上下文
 * @param options - 分析选项
 * @returns 项目符号表
 */
export const analyzeProject = (
  context: ProjectAnalysisContext,
  options: AnalysisOptions = {}
): ReturnType<typeof createProjectSymbolTable> => {
  const sourceFiles = getSourceFiles(context.program, context.rootFiles);
  
  sourceFiles.forEach(sourceFile => {
    const fileSymbols = analyzeSourceFile(sourceFile, context.typeChecker, options);
    addFileSymbols(context.symbolTable, fileSymbols);
  });
  
  return context.symbolTable;
};

/**
 * 按文件分组符号
 * @param symbols - 符号集合
 * @param symbolTable - 符号表
 * @returns 按文件分组的符号映射
 */
export const groupSymbolsByFile = (
  symbols: Set<string>, 
  symbolTable: ReturnType<typeof createProjectSymbolTable>
): Map<string, string[]> => {
  const result = new Map<string, string[]>();
  
  symbols.forEach(symbolName => {
    const parts = symbolName.split(':');
    if (parts.length >= 2) {
      const [fileName, localName] = parts;
      if (fileName && localName) {
        if (!result.has(fileName)) {
          result.set(fileName, []);
        }
        const fileArray = result.get(fileName);
        if (fileArray) {
          fileArray.push(localName);
        }
      }
    }
  });
  
  return result;
};

/**
 * 计算统计信息
 * @param symbolTable - 符号表
 * @param includedSymbols - 包含的符号
 * @param unusedSymbols - 未使用的符号
 * @returns 统计信息
 */
export const calculateStatistics = (
  symbolTable: ReturnType<typeof createProjectSymbolTable>,
  includedSymbols: Set<string>,
  unusedSymbols: Set<string>
): TreeShakingStatistics => {
  const totalSymbols = getAllSymbols(symbolTable).size;
  const includedCount = includedSymbols.size;
  const unusedCount = unusedSymbols.size;
  const removalRate = totalSymbols > 0 ? (unusedCount / totalSymbols) * 100 : 0;
  
  return {
    totalSymbols,
    includedSymbols: includedCount,
    unusedSymbols: unusedCount,
    removalRate: Math.round(removalRate * 100) / 100
  };
};

/**
 * 获取程序诊断信息
 * @param program - TypeScript程序
 * @returns 错误诊断列表
 */
export const getDiagnostics = (program: ts.Program): ts.Diagnostic[] => {
  const diagnostics = [
    ...program.getSemanticDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getGlobalDiagnostics()
  ];
  
  return diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
};

/**
 * 执行 Tree Shaking 分析
 * @param context - 项目分析上下文
 * @param entryPoints - 入口点列表
 * @param options - 分析选项
 * @returns Tree Shaking 分析结果
 */
export const performTreeShaking = (
  context: ProjectAnalysisContext,
  entryPoints: string[],
  options: AnalysisOptions = {}
): TreeShakingResult => {
  // 分析项目
  const symbolTable = analyzeProject(context, options);

  // 计算符号闭包
  const includedSymbols = calculateClosure(symbolTable, entryPoints);

  // 查找未使用的符号
  const unusedSymbols = findUnusedSymbols(symbolTable, Array.from(includedSymbols));

  // 按文件分组
  const includedByFile = groupSymbolsByFile(includedSymbols, symbolTable);
  const unusedByFile = groupSymbolsByFile(unusedSymbols, symbolTable);

  // 计算统计信息
  const statistics = calculateStatistics(symbolTable, includedSymbols, unusedSymbols);

  return {
    entryPoints,
    includedSymbols,
    unusedSymbols,
    includedByFile,
    unusedByFile,
    symbolTable,
    statistics
  };
};

/**
 * 创建项目分析上下文
 * @param rootFiles - 根文件列表
 * @param compilerOptions - 编译选项
 * @returns 项目分析上下文
 */
export const createProjectAnalysisContext = (
  rootFiles: string[],
  compilerOptions: ts.CompilerOptions = {}
): ProjectAnalysisContext => {
  const program = createProgram(rootFiles, compilerOptions);
  const typeChecker = program.getTypeChecker();
  const symbolTable = createProjectSymbolTable();
  
  return {
    program,
    typeChecker,
    symbolTable,
    rootFiles,
    compilerOptions
  };
};

/**
 * 从配置文件创建项目分析上下文
 * @param configPath - 配置文件路径
 * @returns 项目分析上下文
 */
export const createProjectAnalysisContextFromConfig = (configPath: string): ProjectAnalysisContext => {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(`读取配置文件失败: ${configFile.error.messageText}`);
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  );

  if (parsedConfig.errors.length > 0 && parsedConfig.errors[0]) {
    throw new Error(`解析配置文件失败: ${parsedConfig.errors[0].messageText}`);
  }

  if (!parsedConfig.fileNames) {
    throw new Error('配置文件未指定任何源文件');
  }

  return createProjectAnalysisContext(parsedConfig.fileNames, parsedConfig.options);
};

/**
 * 从文件列表创建项目分析上下文
 * @param files - 文件列表
 * @param options - 编译选项
 * @returns 项目分析上下文
 */
export const createProjectAnalysisContextFromFiles = (
  files: string[], 
  options: ts.CompilerOptions = {}
): ProjectAnalysisContext => {
  return createProjectAnalysisContext(files, options);
};
