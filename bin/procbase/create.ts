import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { getProcbaseRoot } from '../../common/paths';

const createPackageJson = (procbaseName: string): string => {
    const content = {
        name: procbaseName,
        version: '0.1.0',
        type: 'module',
        dependencies: {},
        devDependencies: {
            "typescript": "^5",
            "@types/bun": "latest"
        }
    };
    return JSON.stringify(content, null, 2);
}

const createTsConfig = (): string => {
    const content = {
        "compilerOptions": {
            "target": "esnext",
            "module": "esnext",
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true,
            "forceConsistentCasingInFileNames": true,
            "moduleResolution": "bundler",
            "paths": {
                "@t/*": ["./types/*"],
                "@i/*": ["./instances/*"]
            }
        },
        "include": ["types", "instances"]
    };
    return JSON.stringify(content, null, 2);
}

const createGitIgnore = (): string => {
    return `
# Dependencies
node_modules/
bun.lock

# Databases
lancedb/
symbols.sqlite

# Build output
dist/
    `.trim();
}

export const createProcbase = (name: string) => {
  const rootDir = getProcbaseRoot();
  const procbasePath = path.join(rootDir, name);

  if (fs.existsSync(procbasePath)) {
    console.error(`Error: Procbase '${name}' already exists at ${procbasePath}`);
    process.exit(1);
  }

  console.log(`Creating new procbase '${name}' at ${procbasePath}...`);

  try {
    // Create root and subdirectories
    fs.mkdirSync(procbasePath, { recursive: true });
    fs.mkdirSync(path.join(procbasePath, 'instances'), { recursive: true });
    fs.mkdirSync(path.join(procbasePath, 'types'), { recursive: true });
    fs.mkdirSync(path.join(procbasePath, 'lancedb'), { recursive: true });

    // Create files
    fs.writeFileSync(path.join(procbasePath, 'package.json'), createPackageJson(name));
    fs.writeFileSync(path.join(procbasePath, 'tsconfig.json'), createTsConfig());
    fs.writeFileSync(path.join(procbasePath, 'symbols.sqlite'), '');
    fs.writeFileSync(path.join(procbasePath, '.gitignore'), createGitIgnore());

    // Initialize bun and install dependencies to create bun.lock
    console.log('Initializing bun and installing dependencies...');
    execSync('bun install', { cwd: procbasePath, stdio: 'inherit' });

    console.log(`\nSuccessfully created procbase '${name}'.`);
    console.log(`You can start working in the new directory:`);
    console.log(`  cd ${procbasePath}`);

  } catch (error) {
    console.error(`\nFailed to create procbase '${name}'.`);
    if (error instanceof Error) {
        console.error(error.message);
    }
    // Clean up created directory on failure
    if (fs.existsSync(procbasePath)) {
        fs.rmSync(procbasePath, { recursive: true, force: true });
    }
    process.exit(1);
  }
}; 