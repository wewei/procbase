import { join, dirname, basename, extname } from 'path';
import { existsSync, readdirSync, writeFileSync, unlinkSync } from 'fs';
import analyzeProject from '@f/analyzeProject';
import performTreeShaking from '@f/performTreeShaking';
import createDefaultOptions from '@f/createProjectContext/createDefaultOptions';
import fromConfig from '@f/createProjectContext/fromConfig';
import fromFiles from '@f/createProjectContext/fromFiles';
import type { TreeShakingResult } from '@t/tree-shaking/TreeShakingResult';
import { 
  generateDetailedReport, 
  generateSummaryReport, 
  generateJSONReport, 
  generateMarkdownReport, 
  generateDependencyGraph,
  generateAdjacencyListReport,
  findCircularDependencies,
  findLargestSymbols
} from './TreeShakingReporter';

/**
 * CLI选项
 */
export type CLIOptions = {
  config?: string;
  files?: string[];
  entryPoints: string[];
  output?: string;
  format: ReportFormat[];
  checkCircular: boolean;
  showLargest: boolean;
  strict: boolean;
  graph: boolean;
  includeNodeModules: boolean;  // 是否包含 node_modules 中的依赖
  includeSystemSymbols: boolean;  // 是否包含系统符号（如内置类型）
  compilerOptions?: any;
};

/**
 * 报告格式
 */
export type ReportFormat = 'text' | 'json' | 'markdown' | 'dot' | 'graph';

/**
 * 运行分析
 * @param options - CLI选项
 */
export const runAnalysis = async (options: CLIOptions): Promise<void> => {
  try {
    console.log('🔍 开始 TypeScript 项目分析...');
    console.log('');

    // 创建分析上下文
    let context;
    
    if (options.config) {
      console.log(`📝 使用配置文件: ${options.config}`);
      context = fromConfig(options.config);
    } else if (options.files && options.files.length > 0) {
      console.log(`📂 分析文件: ${options.files.join(', ')}`);
      const compilerOptions = options.compilerOptions || createDefaultOptions();
      context = fromFiles(options.files, compilerOptions);
    } else {
      throw new Error('必须指定配置文件或文件列表');
    }

    // 执行项目分析
    const analysisResult = analyzeProject(context, {
      includeNodeModules: options.includeNodeModules,
      includeSystemSymbols: options.includeSystemSymbols
    });

    // 检查编译错误
    if (analysisResult.diagnostics.length > 0) {
      console.warn('⚠️  发现编译错误:');
      analysisResult.diagnostics.forEach((d: any) => {
        const file = d.file ? basename(d.file.fileName) : '未知文件';
        const line = d.file && d.start ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : '?';
        console.warn(`  ${file}:${line} - ${d.messageText}`);
      });
      
      if (options.strict) {
        throw new Error('在严格模式下不允许编译错误');
      }
      console.log('');
    }

    // 执行 Tree Shaking 分析
    const result = performTreeShaking(analysisResult, options.entryPoints, {
      includeInternalSymbols: options.includeNodeModules,
      followTypeOnlyImports: options.includeSystemSymbols
    });
    
    console.log('✅ 分析完成!');
    console.log('');

    // 显示简要报告
    console.log(generateSummaryReport(result));
    console.log('');

    // 如果指定了 --graph 选项，显示依赖关系邻接表
    if (options.graph) {
      console.log(generateAdjacencyListReport(result));
      console.log('');
    }

    // 保存报告
    if (options.output && options.output.trim()) {
      await saveReports(result, options.output.trim(), options.format);
    }

    // 循环依赖检查
    if (options.checkCircular) {
      const cycles = findCircularDependencies(result.symbolTable);
      if (cycles.length > 0) {
        console.log('🔄 发现循环依赖:');
        cycles.forEach((cycle, index) => {
          console.log(`  ${index + 1}. ${cycle.join(' -> ')}`);
        });
      } else {
        console.log('✅ 未发现循环依赖');
      }
      console.log('');
    }

    // 显示影响最大的符号
    if (options.showLargest) {
      const largest = findLargestSymbols(result.symbolTable, 5);
      console.log('📊 依赖最多的符号:');
      largest.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.symbol.split(':')[1]} (${item.dependencyCount} 个依赖)`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ 分析失败:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

/**
 * 保存报告
 * @param result - Tree shaking分析结果
 * @param outputPath - 输出路径
 * @param formats - 报告格式列表
 */
const saveReports = async (
  result: TreeShakingResult, 
  outputPath: string, 
  formats: ReportFormat[]
): Promise<void> => {
  const baseDir = dirname(outputPath);
  const baseName = basename(outputPath, extname(outputPath));

  // 确保输出目录存在
  if (baseDir && baseDir !== '.' && !existsSync(baseDir)) {
    try {
      readdirSync(baseDir, { withFileTypes: true }).forEach(dirent => {
        if (!dirent.isDirectory()) {
          const filePath = join(baseDir, dirent.name);
          if (existsSync(filePath)) {
            unlinkSync(filePath);
          }
        }
      });
    } catch (error) {
      console.warn(`⚠️  无法创建目录 ${baseDir}: ${error instanceof Error ? error.message : error}`);
      return;
    }
  }

  for (const format of formats) {
    let content: string;
    let extension: string;

    switch (format) {
      case 'text':
        content = generateDetailedReport(result);
        extension = '.txt';
        break;
      case 'json':
        content = generateJSONReport(result);
        extension = '.json';
        break;
      case 'markdown':
        content = generateMarkdownReport(result);
        extension = '.md';
        break;
      case 'dot':
        content = generateDependencyGraph(result);
        extension = '.dot';
        break;
      case 'graph':
        content = generateAdjacencyListReport(result);
        extension = '.graph';
        break;
      default:
        continue;
    }

    const filePath = join(baseDir, `${baseName}${extension}`);
    try {
      writeFileSync(filePath, content, 'utf8');
      console.log(`📄 报告已保存: ${filePath}`);
    } catch (error) {
      console.error(`❌ 保存报告失败 ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }
};

/**
 * 解析命令行参数
 * @param args - 命令行参数数组
 * @returns CLI选项
 */
export const parseArgs = (args: string[]): CLIOptions => {
  const options: CLIOptions = {
    entryPoints: [],
    format: ['text'],
    checkCircular: false,
    showLargest: false,
    strict: false,
    graph: false,
    includeNodeModules: false,
    includeSystemSymbols: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--config':
      case '-c':
        if (i + 1 < args.length) {
          options.config = args[++i];
        }
        break;
      case '--files':
      case '-f': {
        const filesArg = args[++i] ?? '';
        options.files = typeof filesArg === 'string' ? filesArg.split(',').map(f => f.trim()) : [];
        break;
      }
      case '--entry':
      case '-e': {
        const entryArg = args[++i] ?? '';
        options.entryPoints = typeof entryArg === 'string' ? entryArg.split(',').map(e => e.trim()) : [];
        break;
      }
      case '--output':
      case '-o': {
        const outputArg = args[++i] ?? '';
        options.output = typeof outputArg === 'string' ? outputArg : undefined;
        break;
      }
      case '--format': {
        const formatArg = args[++i] ?? '';
        options.format = typeof formatArg === 'string' ? formatArg.split(',').map(f => f.trim() as ReportFormat) : ['text'];
        break;
      }
      case '--check-circular':
        options.checkCircular = true;
        break;
      case '--show-largest':
        options.showLargest = true;
        break;
      case '--strict':
        options.strict = true;
        break;
      case '--graph':
        options.graph = true;
        break;
      case '--include-node-modules':
        options.includeNodeModules = true;
        break;
      case '--include-system-symbols':
        options.includeSystemSymbols = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
};

/**
 * 打印帮助信息
 */
export const printHelp = (): void => {
  console.log(`
🔍 ts-inspect - TypeScript 项目分析工具

用法:
  ts-inspect [选项]

选项:
  -c, --config <path>          指定 TypeScript 配置文件
  -f, --files <files>          指定要分析的文件列表（逗号分隔）
  -e, --entry <symbols>        指定入口点符号（逗号分隔）
  -o, --output <path>          指定输出文件路径
  --format <formats>           指定输出格式（text,json,markdown,dot,graph）
  --check-circular             检查循环依赖
  --show-largest               显示依赖最多的符号
  --strict                     严格模式（不允许编译错误）
  --graph                      输出依赖关系邻接表
  --include-node-modules       包含 node_modules 中的依赖
  --include-system-symbols     包含系统符号（如内置类型）
  -h, --help                   显示帮助信息

示例:
  ts-inspect --config tsconfig.json --entry main,utils --output report
  ts-inspect --files src/main.ts,src/utils.ts --entry main --format json,markdown
  ts-inspect --config tsconfig.json --check-circular --show-largest
  ts-inspect --config tsconfig.json --entry main --format graph --output dependencies
`);
};

/**
 * 运行示例
 */
export const runExample = async (): Promise<void> => {
  const options: CLIOptions = {
    files: ['src/**/*.ts'],
    entryPoints: ['src/index.ts'],
    format: ['text'],
    checkCircular: false,
    showLargest: false,
    strict: false,
    graph: false,
    includeNodeModules: false,
    includeSystemSymbols: false
  };

  await runAnalysis(options);
};

// 如果直接运行此文件
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
  } else {
    const options = parseArgs(args);
    runAnalysis(options);
  }
}
