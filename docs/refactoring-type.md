# 类型系统重构计划：走向统一化

## 1. 现状与问题

目前，我们的类型定义分散在各个功能模块的 `types` 子文件夹中。例如：

- `lang/analyzeProject/types/*.ts`
- `lang/createProjectSymbolTable/types/*.ts`
- `lang/performTreeShaking/types/*.ts`

这种结构在模块化初期是有效的，但随着项目复杂度的增加，暴露了一些问题：

- **引用路径复杂**：模块间的类型引用需要复杂的相对路径（如 `../../module/types/TypeName`），难以维护。
- **职责界限模糊**：某些本应是全局共享的核心类型（如 `SymbolInfo`），被局限在特定模块下，导致了不必要的跨模块依赖。
- **可发现性差**：开发者需要了解内部实现才能找到特定类型，而不是在一个统一的位置查找。

## 2. 目标：建立统一的类型中心

为了解决以上问题，我们提议将所有类型定义迁移到一个全局的 `lang/types` 目录中，并按照领域（或称 "命名空间"）进行组织。

### 2.1. 预期目录结构

重构后的目录结构将如下所示：

```
lang/
├── types/
│   ├── analysis/
│   │   ├── AnalysisOptions.ts
│   │   ├── ProjectAnalysisContext.ts
│   │   ├── ProjectAnalysisResult.ts
│   │   └── ProjectStatistics.ts
│   │
│   ├── project/
│   │   ├── ExtractedSymbols.ts
│   │   ├── FileSymbols.ts
│   │   ├── ImportInfo.ts
│   │   ├── ProjectSymbolTableState.ts
│   │   ├── SourceLocation.ts
│   │   ├── SymbolExtractionOptions.ts
│   │   └── SymbolInfo.ts
│   │
│   └── tree-shaking/
│       ├── TreeShakingOptions.ts
│       ├── TreeShakingResult.ts
│       └── TreeShakingStatistics.ts
│
└── types.ts      # 统一从此文件 re-export 所有类型
```

**核心思想**：

1.  **全局 `lang/types` 目录**：作为所有共享类型的唯一来源 (Single Source of Truth)。
2.  **命名空间子文件夹**：在 `lang/types` 内部，按领域（`analysis`, `project`, `tree-shaking`）对类型进行分组，保持高内聚。
3.  **统一导出文件**：保留 `lang/types.ts` 作为项目的类型总入口，它将 re-export 所有在 `lang/types/` 子目录中定义的类型。应用代码应优先从这里导入类型。

## 3. 重构实施步骤

为了平稳地完成迁移，我们将遵循以下步骤：

### 第 1 步：创建新的目录结构

- 在 `lang/` 目录下创建 `types/` 文件夹。
- 在 `lang/types/` 内部创建 `analysis/`, `project/`, 和 `tree-shaking/` 三个子文件夹。

### 第 2 步：迁移类型文件

- **移动 Analysis 相关类型**：
  将 `lang/analyzeProject/types/*` 内的所有 `.ts` 文件移动到 `lang/types/analysis/`。
- **移动 Project 相关类型**：
  将 `lang/createProjectSymbolTable/types/*` 和 `lang/extractSymbols/types/*` 内的所有 `.ts` 文件移动到 `lang/types/project/`。
- **移动 TreeShaking 相关类型**：
  将 `lang/performTreeShaking/types/*` 内的所有 `.ts` 文件移动到 `lang/types/tree-shaking/`。

### 第 3 步：修正类型文件内部的引用

- 文件移动后，类型文件之间的相对引用会失效。
- 例如，`ProjectAnalysisResult.ts` 对 `ProjectSymbolTableState` 的引用路径需要从 `../../createProjectSymbolTable/types/ProjectSymbolTableState` 更新为 `../project/ProjectSymbolTableState`。
- 需要逐一检查并修正所有位于 `lang/types/` 目录下的类型文件的 `import` 路径。

### 第 4 步：更新 `lang/types.ts` 的 re-export 路径

- 修改 `lang/types.ts` 文件，使其从新的路径 re-export所有类型。
- 例如，`export type { ProjectAnalysisResult } from './analyzeProject/types/ProjectAnalysisResult';`
- 应更新为 `export type { ProjectAnalysisResult } from './types/analysis/ProjectAnalysisResult';`。

### 第 5 步：全局更新代码库中的引用

- 这是最关键的一步。所有使用到这些类型的文件都需要更新其 `import` 语句。
- 绝大部分引用应该都指向 `lang/types` 或者 `lang/index`，由于我们在上一步已经更新了 `lang/types.ts`，这些引用应该能自动正常工作。
- 对于任何直接深度引用旧路径的地方（例如 `from '.../createProjectSymbolTable/types'`)，需要通过全局搜索找到并将其修正。

### 第 6 步：清理旧的 `types` 文件夹

- 在确认所有引用都已更新，且项目编译和测试通过后，删除所有功能模块下原有的、现已为空的 `types` 文件夹。
  - `rm -rf lang/analyzeProject/types`
  - `rm -rf lang/createProjectSymbolTable/types`
  - `rm -rf lang/extractSymbols/types`
  - `rm -rf lang/performTreeShaking/types`

### 第 7 步：验证

- **编译检查**：运行 `bun run tsc --noEmit`，确保没有类型错误或路径解析问题。
- **测试验证**：运行 `bun test`，确保所有测试用例都能通过，保证重构未引入逻辑错误。

## 4. 预期收益

本次重构将为项目带来一个更清晰、更健壮、更易于维护的类型系统，使得未来的开发工作更加高效。 