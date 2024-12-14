import { copy } from 'fs-extra';
import path from 'path';
import { paths, runCommand, log } from '../utils';

export async function buildFrontend() {
  log('開始建置前端...');
  await runCommand('pnpm build', paths.frontend);

  log('複製前端建置檔案到後端的 public 目錄...');
  await copy(path.join(paths.frontend, 'dist'), path.join(paths.dist, 'backend/public'));
}
