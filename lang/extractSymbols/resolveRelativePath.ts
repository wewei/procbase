import path from 'node:path';

/**
 * 解析相对路径
 * @param fromPath - 源文件路径
 * @param toPath - 目标文件路径
 * @returns 解析后的路径
 */
const resolveRelativePath = (fromPath: string, toPath: string): string => {
  // 如果是相对路径，则相对于当前文件解析
  if (toPath.startsWith('.')) {
    const fromDir = path.dirname(fromPath);
    return path.basename(path.resolve(fromDir, toPath));
  }
  return toPath;
};

export default resolveRelativePath; 