import type { OfflineEntityName } from './types.ts';

export type OfflineRecord = {
  key: string;
  value: unknown;
};

export type OfflineStore = {
  get(store: OfflineEntityName, key: string): Promise<OfflineRecord | undefined>;
  put(store: OfflineEntityName, record: OfflineRecord): Promise<void>;
  delete(store: OfflineEntityName, key: string): Promise<void>;
  getAll(store: OfflineEntityName): Promise<OfflineRecord[]>;
  transaction<T>(stores: OfflineEntityName[], work: () => Promise<T>): Promise<T>;
};
