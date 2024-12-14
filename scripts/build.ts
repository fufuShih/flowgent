import { remove } from 'fs-extra';
import { paths, log, error } from './utils';
import { buildFrontend } from './tasks/frontend';
import { buildBackend } from './tasks/backend';

async function build() {
  try {
    // 清理舊的建置檔案
    log('清理舊的建置檔案...');
    await remove(paths.dist);

    // 並行建置前後端
    log('開始並行建置前後端...');
    await Promise.all([buildFrontend(), buildBackend()]);

    log('建置完成！🎉');
  } catch (err) {
    error('建置過程發生錯誤:');
    console.error(err);
    process.exit(1);
  }
}

build();
