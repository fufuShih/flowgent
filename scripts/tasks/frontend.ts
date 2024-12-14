import { copy } from 'fs-extra';
import path from 'path';
import { paths, runCommand, log } from '../utils';

export async function buildFrontend() {
  log('Building frontend...');
  await runCommand('pnpm build', paths.frontend);

  log('Copying frontend build to backend public directory...');
  await copy(path.join(paths.frontend, 'dist'), path.join(paths.dist, 'backend/public'));
}
