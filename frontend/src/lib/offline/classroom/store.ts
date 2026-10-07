import type { OfflineEntityName } from './types.ts';

export const OFFLINE_DB_NAME = 'mathventure-classroom';
export const OFFLINE_DB_VERSION = 1;

export const OFFLINE_STORE_NAMES: OfflineEntityName[] = [
  'profiles',
  'classrooms',
  'classStudents',
  'assignments',
  'attempts',
  'attemptGameResults',
  'posts',
  'outbox',
  'conflicts',
  'meta',
];

export class OfflineStorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'OfflineStorageError';
  }
}

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

type IndexedDbRequest<T> = {
  result: T;
  error: Error | null;
  onsuccess: ((event?: Event) => void) | null;
  onerror: ((event?: Event) => void) | null;
};

type IndexedDbObjectStore = {
  get(key: string): IndexedDbRequest<OfflineRecord | undefined>;
  getAll(): IndexedDbRequest<OfflineRecord[]>;
  put(record: OfflineRecord): IndexedDbRequest<unknown>;
  delete(key: string): IndexedDbRequest<unknown>;
};

type IndexedDbTransaction = {
  objectStore(name: string): IndexedDbObjectStore;
  error: Error | null;
  oncomplete: ((event?: Event) => void) | null;
  onerror: ((event?: Event) => void) | null;
  onabort: ((event?: Event) => void) | null;
};

type IndexedDbDatabase = {
  objectStoreNames: { contains(name: string): boolean };
  createObjectStore(name: string, options: { keyPath: string }): void;
  transaction(name: string, mode: 'readonly' | 'readwrite'): IndexedDbTransaction;
  close(): void;
};

type IndexedDbOpenRequest = IndexedDbRequest<IndexedDbDatabase> & {
  onupgradeneeded: (() => void) | null;
  onblocked: (() => void) | null;
};

type IndexedDbFactory = {
  open(name: string, version: number): IndexedDbOpenRequest;
};

function requestResult<T>(request: IndexedDbRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new OfflineStorageError('IndexedDB request failed.'));
  });
}

function openDatabase(databaseName: string): Promise<IndexedDbDatabase> {
  const indexedDb = (globalThis as unknown as { indexedDB?: IndexedDbFactory }).indexedDB;
  if (!indexedDb) {
    return Promise.reject(new OfflineStorageError('IndexedDB is unavailable in this browser.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(databaseName, OFFLINE_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const storeName of OFFLINE_STORE_NAMES) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'key' });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new OfflineStorageError('Unable to open offline storage.'));
    request.onblocked = () => reject(new OfflineStorageError('Offline storage is blocked by another browser tab.'));
  });
}

export function createIndexedDbStore(databaseName = OFFLINE_DB_NAME): OfflineStore {
  const withStore = async <T>(
    storeName: OfflineEntityName,
    mode: 'readonly' | 'readwrite',
    operation: (store: IndexedDbObjectStore) => IndexedDbRequest<T>,
  ): Promise<T> => {
    const database = await openDatabase(databaseName);
    try {
      const transaction = database.transaction(storeName, mode);
      const result = await requestResult(operation(transaction.objectStore(storeName)));
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new OfflineStorageError('IndexedDB transaction failed.'));
        transaction.onabort = () => reject(transaction.error ?? new OfflineStorageError('IndexedDB transaction aborted.'));
      });
      return result;
    } finally {
      database.close();
    }
  };

  return {
    get: async (storeName, key) => {
      const result = await withStore(storeName, 'readonly', (store) => store.get(key));
      return result as OfflineRecord | undefined;
    },
    put: async (storeName, record) => {
      await withStore(storeName, 'readwrite', (store) => store.put(record));
    },
    delete: async (storeName, key) => {
      await withStore(storeName, 'readwrite', (store) => store.delete(key));
    },
    getAll: async (storeName) => {
      const result = await withStore(storeName, 'readonly', (store) => store.getAll());
      return result as OfflineRecord[];
    },
    transaction: async (_stores, work) => work(),
  };
}
