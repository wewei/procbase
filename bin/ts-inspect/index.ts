import * as path from 'path';
import * as fs from 'fs';
import { 
  createProjectAnalysisContextFromConfig, 
  createProjectAnalysisContextFromFiles, 
  createDefaultCompilerOptions,
  performTreeShaking,
  getDiagnostics
} from '@/lang/ProjectAnalyzer';
import type { TreeShakingResult } from '@/lang/ProjectAnalyzer';
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
      context = createProjectAnalysisContextFromConfig(options.config);
    } else if (options.files && options.files.length > 0) {
      console.log(`📂 分析文件: ${options.files.join(', ')}`);
      const compilerOptions = options.compilerOptions || createDefaultCompilerOptions();
      context = createProjectAnalysisContextFromFiles(options.files, compilerOptions);
    } else {
      throw new Error('必须指定配置文件或文件列表');
    }

    // 检查编译错误
    const diagnostics = getDiagnostics(context.program);
    if (diagnostics.length > 0) {
      console.warn('⚠️  发现编译错误:');
      diagnostics.forEach(d => {
        const file = d.file ? path.basename(d.file.fileName) : '未知文件';
        const line = d.file && d.start ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : '?';
        console.warn(`  ${file}:${line} - ${d.messageText}`);
      });
      
      if (options.strict) {
        throw new Error('在严格模式下不允许编译错误');
      }
      console.log('');
    }

    // 执行分析
    const result = performTreeShaking(context, options.entryPoints);
    
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
  const baseDir = path.dirname(outputPath);
  const baseName = path.basename(outputPath, path.extname(outputPath));

  // 确保输出目录存在
  if (baseDir && baseDir !== '.' && !fs.existsSync(baseDir)) {
    try {
      fs.mkdirSync(baseDir, { recursive: true });
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

    const filePath = path.join(baseDir, `${baseName}${extension}`);
    try {
      fs.writeFileSync(filePath, content, 'utf8');
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
    graph: false
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
  console.log('🚀 运行 TypeScript 项目分析示例...');
  
  // 这里可以添加一个简单的示例
  const exampleOptions: CLIOptions = {
    files: ['example.ts'],
    entryPoints: ['main'],
    format: ['text'],
    checkCircular: false,
    showLargest: false,
    strict: false,
    graph: false
  };
  
  try {
    await runAnalysis(exampleOptions);
  } catch (error) {
    console.log('示例运行失败，这是正常的，因为示例文件不存在');
  }
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
