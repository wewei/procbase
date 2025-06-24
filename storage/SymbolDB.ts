import { Database } from 'bun:sqlite';
import path from 'node:path';
import type { ExtractedSymbols } from '../types/project/ExtractedSymbols';
import type { SymbolInfo } from '../types/project/SymbolInfo';
import type { ImportInfo } from '../types/project/ImportInfo';

export type SymbolDB = {
  initialize(): void;
  addSymbols(filePath: string, symbols: ExtractedSymbols): void;
  getSymbols(filePath: string): ExtractedSymbols | null;
  getAllSymbols(): SymbolInfo[];
  getDependencies(symbolName: string): string[];
  getDependents(symbolName: string): string[];
  close(): void;
};

export const createSymbolDB = (dbPath: string): SymbolDB => {
  const db = new Database(dbPath);
  
  const initialize = () => {
    // Create tables for symbols and dependencies
    db.run(`
      CREATE TABLE IF NOT EXISTS symbols (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        export_type TEXT NOT NULL,
        symbol_type TEXT NOT NULL,
        source_location TEXT,
        documentation TEXT,
        is_exported BOOLEAN NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dependent_symbol TEXT NOT NULL,
        dependency_symbol TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(dependent_symbol, dependency_symbol)
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        name TEXT NOT NULL,
        from_module TEXT NOT NULL,
        is_default BOOLEAN NOT NULL,
        original_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run('CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name)');
    db.run('CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_path)');
    db.run('CREATE INDEX IF NOT EXISTS idx_dependencies_dependent ON dependencies(dependent_symbol)');
    db.run('CREATE INDEX IF NOT EXISTS idx_dependencies_dependency ON dependencies(dependency_symbol)');
    db.run('CREATE INDEX IF NOT EXISTS idx_imports_file ON imports(file_path)');
  };

  const addSymbols = (filePath: string, symbols: ExtractedSymbols) => {
    // Clear existing symbols for this file
    db.prepare('DELETE FROM symbols WHERE file_path = ?').run(filePath);
    db.prepare('DELETE FROM dependencies WHERE file_path = ?').run(filePath);
    db.prepare('DELETE FROM imports WHERE file_path = ?').run(filePath);

    const insertSymbol = db.prepare(`
      INSERT OR REPLACE INTO symbols (name, file_path, export_type, symbol_type, source_location, documentation, is_exported, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const insertDependency = db.prepare(`
      INSERT OR IGNORE INTO dependencies (dependent_symbol, dependency_symbol, file_path)
      VALUES (?, ?, ?)
    `);

    const insertImport = db.prepare(`
      INSERT OR REPLACE INTO imports (file_path, name, from_module, is_default, original_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Add exported symbols
    symbols.exports.forEach((symbol, name) => {
      insertSymbol.run(
        name,
        filePath,
        'export',
        symbol.type,
        JSON.stringify(symbol.sourceLocation),
        symbol.documentation || null,
        symbol.isExported
      );
    });

    // Add internal symbols
    symbols.internal.forEach((symbol, name) => {
      insertSymbol.run(
        name,
        filePath,
        'internal',
        symbol.type,
        JSON.stringify(symbol.sourceLocation),
        symbol.documentation || null,
        symbol.isExported
      );
    });

    // Add dependencies
    symbols.exports.forEach((symbol, name) => {
      symbol.dependencies.forEach(dep => {
        insertDependency.run(name, dep, filePath);
      });
    });

    symbols.internal.forEach((symbol, name) => {
      symbol.dependencies.forEach(dep => {
        insertDependency.run(name, dep, filePath);
      });
    });

    // Add imports
    symbols.imports.forEach((importInfo, name) => {
      insertImport.run(
        filePath,
        name,
        importInfo.fromModule,
        importInfo.isDefault,
        importInfo.originalName || null
      );
    });
  };

  const getSymbols = (filePath: string): ExtractedSymbols | null => {
    const symbols = db.prepare('SELECT * FROM symbols WHERE file_path = ?').all(filePath) as any[];
    const dependencies = db.prepare('SELECT * FROM dependencies WHERE file_path = ?').all(filePath) as any[];
    const imports = db.prepare('SELECT * FROM imports WHERE file_path = ?').all(filePath) as any[];

    if (symbols.length === 0) return null;

    const result: ExtractedSymbols = {
      exports: new Map(),
      internal: new Map(),
      imports: new Map()
    };

    // Reconstruct symbols from database
    symbols.forEach(row => {
      const symbol: SymbolInfo = {
        name: row.name,
        kind: 0, // Default value, would need to be reconstructed from type
        type: row.symbol_type,
        declaration: null as any, // Would need to be reconstructed from AST
        isExported: Boolean(row.is_exported),
        documentation: row.documentation,
        sourceLocation: JSON.parse(row.source_location || '{}'),
        fileName: row.file_path,
        dependencies: new Set(),
        dependents: new Set()
      };

      // Add dependencies
      const symbolDeps = dependencies.filter(d => d.dependent_symbol === row.name);
      symbolDeps.forEach(d => symbol.dependencies.add(d.dependency_symbol));

      if (row.export_type === 'export') {
        result.exports.set(row.name, symbol);
      } else {
        result.internal.set(row.name, symbol);
      }
    });

    // Reconstruct imports
    imports.forEach(row => {
      const importInfo: ImportInfo = {
        name: row.name,
        fromModule: row.from_module,
        isDefault: Boolean(row.is_default),
        originalName: row.original_name
      };
      result.imports.set(row.name, importInfo);
    });

    return result;
  };

  const getAllSymbols = (): SymbolInfo[] => {
    return db.prepare('SELECT * FROM symbols').all() as SymbolInfo[];
  };

  const getDependencies = (symbolName: string): string[] => {
    const deps = db.prepare('SELECT dependency_symbol FROM dependencies WHERE dependent_symbol = ?').all(symbolName) as any[];
    return deps.map(d => d.dependency_symbol);
  };

  const getDependents = (symbolName: string): string[] => {
    const deps = db.prepare('SELECT dependent_symbol FROM dependencies WHERE dependency_symbol = ?').all(symbolName) as any[];
    return deps.map(d => d.dependent_symbol);
  };

  const close = () => {
    db.close();
  };

  return {
    initialize,
    addSymbols,
    getSymbols,
    getAllSymbols,
    getDependencies,
    getDependents,
    close
  };
}; 