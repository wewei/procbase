import ts from 'typescript';

/**
 * 获取程序诊断信息
 * @param program - TypeScript程序
 * @returns 错误诊断列表
 */
const getDiagnostics = (program: ts.Program): ts.Diagnostic[] => {
  const diagnostics = [
    ...program.getSemanticDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getGlobalDiagnostics()
  ];
  
  return diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
};

export default getDiagnostics; 