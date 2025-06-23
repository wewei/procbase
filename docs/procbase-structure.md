# Procbase Structure

A `procbase` is a specialized Bun package designed to store and manage TypeScript symbols in a structured way. This document outlines the directory structure and conventions for creating and maintaining a procbase.

## Directory Layout

Here is an example of a typical `procbase` directory structure:

```
.
├── instances/
│   └── my-instance/
│       ├── __tests__/
│       │   ├── assets/
│       │   │   └── test-data.json
│       │   └── main.test.ts
│       ├── index.ts
│       └── private-module.ts
├── types/
│   └── Procbase/
│       └── TypeScriptProject.ts
├── lancedb/
├── bun.lock
├── symbols.sqlite
├── package.json
└── tsconfig.json
```

## Core Components

### 1. Types (`types/`)

The `types` directory contains all compile-time TypeScript type definitions.

*   **Namespacing**: The folder and file paths within `types/` create a namespace hierarchy. For example, a type defined in `types/Procbase/TypeScriptProject.ts` would belong to the `Procbase.TypeScriptProject` namespace.
*   **No Index Files**: To maintain a clear and explicit namespace structure, `index.ts` files are not permitted anywhere within the `types` directory tree. Each file should contain distinct, named exports.

### 2. Instances (`instances/`)

The `instances` directory contains the concrete implementations (variables, functions, classes).

*   **Structure**: Each instance is encapsulated within its own subfolder (e.g., `instances/my-instance/`).
*   **Entry Point**: Every instance subfolder must have an `index.ts` file that serves as its public entry point. This file should have a single default export which is the instance itself.
*   **Privacy**: All other files and subdirectories within an instance's folder are considered private to that instance.

### 3. Behaviors (`__tests__/`)

Behaviors are test suites that validate the functionality of instances.

*   **Location**: Each behavior is located in a `__tests__` directory inside the corresponding instance's subfolder.
*   **Test Files**: Test cases must be placed in files with a `.test.ts` extension (e.g., `main.test.ts`).
*   **Test Assets**: Any supporting files for tests, such as JSON fixtures or data files, should be stored in the `__tests__/assets/` directory.

### 4. Databases

At the top level of the procbase, two databases are used for indexing and search:

*   **Symbol Database (`symbols.sqlite`)**: A SQLite database that stores information about all symbols and their relationships (dependencies). This includes:
    *   Symbol metadata (e.g., name, source file location, AST hash).
    *   Type-to-Type dependencies
    *   Instance-to-Type dependencies
    *   Instance-to-Instance dependencies
*   **Semantic Database (`lancedb/`)**: A LanceDB directory that stores vector embeddings for all types and instances. This enables semantic search capabilities.

## Import Rules

This section defines the import conventions to be followed within a procbase to ensure consistency and maintainability.

### 1. No Star Imports

Always use named or default imports. Avoid using wildcard (`*`) imports as they can pollute the namespace and make dependencies less clear.

**Do:**
```typescript
import { MyType } from '@t/MyType';
import myInstance from '@i/my-instance';
```

**Don't:**
```typescript
import * as MyTypes from '@t/MyType';
```

### 2. Explicit Type Imports

When importing types, always use the `import type` syntax. This makes it clear that only type information is being imported, which can be safely erased by the TypeScript compiler.

**Do:**
```typescript
import type { MyType } from '@t/MyType';
```

**Don't:**
```typescript
import { MyType } from '@t/MyType';
```

### 3. Path Aliases and Relative Paths

The procbase uses path aliases for clear and consistent module resolution.

*   `@t/`: Resolves to the `types/` directory.
*   `@i/`: Resolves to the `instances/` directory.

**Rules for usage:**

*   **External Imports:** When importing a symbol from outside the current top-level folder (e.g., importing a type from within an instance), always use a path alias.
    ```typescript
    // Inside instances/my-instance/index.ts
    import type { MyType } from '@t/MyType';
    import anotherInstance from '@i/another-instance';
    ```

*   **Internal Imports:** When importing a symbol from a sibling file or a descendant file within the same top-level folder, use relative paths.
    ```typescript
    // Inside instances/my-instance/index.ts
    import { privateFunction } from './private-module';
    ```

### 4. Node.js Built-in Modules

Always use the `node:` prefix when importing built-in Node.js modules. This makes it explicit that the module is a Node.js native module.

**Do:**
```typescript
import fs from 'node:fs';
import path from 'node:path';
```

**Don't:**
```typescript
import fs from 'fs';
import path from 'path';
```
