import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const getProcbaseRoot = (): string => {
  if (process.env.PROCBASE_ROOT) {
    return process.env.PROCBASE_ROOT;
  }
  return path.join(os.homedir(), '.procbase');
};

export const deleteProcbase = (name: string) => {
  const rootDir = getProcbaseRoot();
  const procbasePath = path.join(rootDir, name);

  if (!fs.existsSync(procbasePath)) {
    console.error(`Error: Procbase '${name}' does not exist at ${procbasePath}`);
    process.exit(1);
  }

  try {
    console.log(`Deleting procbase '${name}' from ${procbasePath}...`);
    fs.rmSync(procbasePath, { recursive: true, force: true });
    console.log(`Successfully deleted procbase '${name}'.`);
  } catch (error) {
    console.error(`\nFailed to delete procbase '${name}'.`);
    if (error instanceof Error) {
        console.error(error.message);
    }
    process.exit(1);
  }
}; 