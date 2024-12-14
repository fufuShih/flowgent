import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

export const execAsync = promisify(exec);

export const paths = {
  root: path.resolve(__dirname, '..'),
  get frontend() {
    return path.resolve(this.root, 'packages/frontend');
  },
  get backend() {
    return path.resolve(this.root, 'packages/backend');
  },
  get dist() {
    return path.resolve(this.root, 'dist');
  },
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
