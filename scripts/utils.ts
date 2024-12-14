import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

export const execAsync = promisify(exec);

// Get script root directory absolute path
const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPTS_DIR, '..');

export const paths = {
  root: ROOT_DIR,
  scripts: SCRIPTS_DIR,
  frontend: {
    root: path.join(ROOT_DIR, 'packages/frontend'),
    dist: path.join(ROOT_DIR, 'packages/frontend/dist'),
  },
  backend: {
    root: path.join(ROOT_DIR, 'packages/backend'),
    dist: path.join(ROOT_DIR, 'packages/backend/dist'),
  },
  dist: path.join(ROOT_DIR, 'dist'),
};

export async function runCommand(command: string, cwd: string) {
  console.log(`Executing command: ${command}`);
  const { stdout, stderr } = await execAsync(command, { cwd });
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
}

export function log(message: string) {
  console.log(`\n🚀 ${message}`);
}

export function error(message: string) {
  console.error(`\n❌ ${message}`);
}
