import { copy } from 'fs-extra';
import path from 'path';
import { paths, runCommand, log } from '../utils';

export async function buildBackend() {
  log('開始建置後端...');
  await runCommand('pnpm build', paths.backend);

  log('複製後端建置檔案...');
  await copy(path.join(paths.backend, 'dist'), path.join(paths.dist, 'backend'));
}
