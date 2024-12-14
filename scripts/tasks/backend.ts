import { copy } from 'fs-extra';
import path from 'path';
import { paths, runCommand, log } from '../utils';

export async function buildBackend() {
  log('Building backend...');
  await runCommand('pnpm build', paths.backend);

  log('Copying backend build files...');
  await copy(path.join(paths.backend, 'dist'), path.join(paths.dist, 'backend'));
}
