import { rimraf } from 'rimraf';
import { paths, log } from '../utils';

export async function cleanDistDirectories() {
  log('Cleaning dist directories...');

  try {
    // 清理並輸出實際路徑以便調試
    console.log('Cleaning paths:');
    console.log('- Frontend:', paths.frontend.dist);
    console.log('- Backend:', paths.backend.dist);

    await Promise.all([rimraf(paths.frontend.dist), rimraf(paths.backend.dist)]);

    console.log('✨ All dist directories cleaned successfully!\n');
  } catch (err) {
    console.error('\n❌ Error while cleaning:', err);
    throw err;
  }
}

// 如果直接執行此文件
if (require.main === module) {
  cleanDistDirectories();
}
