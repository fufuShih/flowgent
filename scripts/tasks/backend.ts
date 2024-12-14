import { paths, runCommand, log } from '../utils';

export async function buildBackend() {
  log('Building backend...');
  await runCommand('pnpm build', paths.backend.root);
}
