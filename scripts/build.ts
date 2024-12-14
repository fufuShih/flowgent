import { paths, log, error, copyFile } from './utils';
import { buildFrontend } from './tasks/frontend';
import { buildBackend } from './tasks/backend';
import { cleanDistDirectories } from './tasks/clean';
import path from 'path';

async function build() {
  try {
    // Clean all dist directories first
    await cleanDistDirectories();

    // Copy environment files
    const isProd = process.env.NODE_ENV === 'production';
    const envFile = isProd ? '.env.production' : '.env';

    await copyFile(path.join(paths.root, envFile), path.join(paths.dist, '.env'));

    // Build frontend and backend in parallel
    log('Starting parallel build...');
    await Promise.all([buildFrontend(), buildBackend()]);

    log('Build completed! 🎉');
  } catch (err) {
    error('Build process failed:');
    console.error(err);
    process.exit(1);
  }
}

build();
