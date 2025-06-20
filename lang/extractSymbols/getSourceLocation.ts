import * as ts from 'typescript';
import type { SourceLocation } from './types';

/**
 * 获取源码位置
 * @param node - 节点
 * @param sourceFile - 源文件
 * @returns 源码位置信息
 */
const getSourceLocation = (node: ts.Node, sourceFile: ts.SourceFile): SourceLocation => {
  const start = node.getStart();
  const end = node.getEnd();
  const lineInfo = sourceFile.getLineAndCharacterOfPosition(start);
  
  return { 
    start, 
    end, 
    line: lineInfo?.line ?? 0, 
    column: lineInfo?.character ?? 0 
  };
};

export default getSourceLocation; 