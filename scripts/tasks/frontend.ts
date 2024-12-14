import { paths, runCommand, log, copyFile } from '../utils';
import path from 'path';

export async function buildFrontend() {
  log('Building frontend...');

  // Copy appropriate .env file
  const isProd = process.env.NODE_ENV === 'production';
  const envFile = isProd ? '.env.production' : '.env';

  await copyFile(path.join(paths.frontend.root, envFile), path.join(paths.frontend.root, '.env'));

  await runCommand('pnpm build', paths.frontend.root);
}
