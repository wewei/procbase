import ts from 'typescript';
import path from 'path';
import type { ProjectAnalysisContext } from '../types';
import createProjectSymbolTable from '../createProjectSymbolTable/index';
import createProgram from '../analyzeProject/createProgram';

/**
 * 从配置文件创建项目分析上下文
 * @param configPath - 配置文件路径
 * @returns 项目分析上下文
 */
const fromConfig = (configPath: string): ProjectAnalysisContext => {
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

  const program = createProgram(parsedConfig.fileNames, parsedConfig.options);
  const typeChecker = program.getTypeChecker();
  const symbolTable = createProjectSymbolTable();
  
  return {
    program,
    typeChecker,
    symbolTable,
    rootFiles: parsedConfig.fileNames,
    compilerOptions: parsedConfig.options
  };
};

export default fromConfig; 