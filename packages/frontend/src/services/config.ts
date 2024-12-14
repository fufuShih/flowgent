import { indexedDBAdapter } from './adapters/indexed-db.adapter';
import { backendAdapter } from './adapters/backend.adapter';
import type { IStorageAdapter } from './adapters/adapter.type';

const useBackend = import.meta.env.VITE_USE_BACKEND === 'true';

export const config = {
  adapter: useBackend ? backendAdapter : (indexedDBAdapter as IStorageAdapter),
};
