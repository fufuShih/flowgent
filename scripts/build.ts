import { remove } from 'fs-extra';
import { paths, log, error } from './utils';
import { buildFrontend } from './tasks/frontend';
import { buildBackend } from './tasks/backend';

async function build() {
  try {
    // Clean old build files
    log('Cleaning old build files...');
    await remove(paths.dist);

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
