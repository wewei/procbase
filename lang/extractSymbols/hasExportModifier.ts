import ts from 'typescript';

/**
 * 检查是否有导出修饰符
 * @param node - 节点
 * @returns 是否有导出修饰符
 */
const hasExportModifier = (node: ts.Node): boolean => {
  return (node as any).modifiers?.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
};

export default hasExportModifier; 