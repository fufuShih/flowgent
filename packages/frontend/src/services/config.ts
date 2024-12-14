import { indexedDBAdapter } from './adapters/indexed-db.adapter';
import type { IStorageAdapter } from './adapters/adapter.type';

export const config = {
  adapter: indexedDBAdapter as IStorageAdapter,
};
