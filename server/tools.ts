import fs from 'node:fs';
import path from 'node:path';
import { createCodeAnalyzer } from './codeAnalyzer';
import { getCurrentProcbase } from '../common/paths';

export const addType = (code: string, namespace: string): { success: boolean; message: string; filePath?: string } => {
  try {
    // Resolve procbase root
    const procbaseRoot = getCurrentProcbase();
    // Convert dot-separated namespace to file path
    const namespaceParts = namespace.split('.');
    const fileName = namespaceParts.pop() + '.ts';
    const directoryPath = path.join(procbaseRoot, 'types', ...namespaceParts);
    const fullPath = path.join(directoryPath, fileName);
    
    // Ensure the directory exists
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
    
    // Check if file already exists
    if (fs.existsSync(fullPath)) {
      return {
        success: false,
        message: `Type file already exists at ${fullPath}. Use update instead.`
      };
    }
    
    // Write the code to the file
    fs.writeFileSync(fullPath, code, 'utf8');
    
    // Analyze the code and store symbols in database
    const dbPath = path.join(procbaseRoot, 'symbols.sqlite');
    const analyzer = createCodeAnalyzer(dbPath);
    
    // Analyze the newly created file
    analyzer.analyzeFile(fullPath).then(result => {
      if (!result.success) {
        console.warn(`Warning: Failed to analyze symbols for ${fullPath}: ${result.message}`);
      }
    }).catch(error => {
      console.warn(`Warning: Error analyzing symbols for ${fullPath}: ${error}`);
    });
    
    return {
      success: true,
      message: `Type added successfully to ${fullPath}`,
      filePath: fullPath
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to add type: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const updateType = (code: string, namespace: string): { success: boolean; message: string; filePath?: string } => {
  try {
    // Resolve procbase root
    const procbaseRoot = getCurrentProcbase();
    // Convert dot-separated namespace to file path
    const namespaceParts = namespace.split('.');
    const fileName = namespaceParts.pop() + '.ts';
    const directoryPath = path.join(procbaseRoot, 'types', ...namespaceParts);
    const fullPath = path.join(directoryPath, fileName);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        message: `Type file does not exist at ${fullPath}. Use add instead.`
      };
    }
    
    // Write the code to the file
    fs.writeFileSync(fullPath, code, 'utf8');
    
    // Analyze the updated code and store symbols in database
    const dbPath = path.join(procbaseRoot, 'symbols.sqlite');
    const analyzer = createCodeAnalyzer(dbPath);
    
    // Analyze the updated file
    analyzer.analyzeFile(fullPath).then(result => {
      if (!result.success) {
        console.warn(`Warning: Failed to analyze symbols for ${fullPath}: ${result.message}`);
      }
    }).catch(error => {
      console.warn(`Warning: Error analyzing symbols for ${fullPath}: ${error}`);
    });
    
    return {
      success: true,
      message: `Type updated successfully at ${fullPath}`,
      filePath: fullPath
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update type: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}; 