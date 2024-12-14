import { paths, runCommand, log } from '../utils';

export async function buildFrontend() {
  log('Building frontend...');
  await runCommand('pnpm build', paths.frontend.root);
}
