import { paths, log, error } from './utils';
import { buildFrontend } from './tasks/frontend';
import { buildBackend } from './tasks/backend';
import { cleanDistDirectories } from './tasks/clean';

async function build() {
  try {
    // Clean all dist directories first
    // await cleanDistDirectories();

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
