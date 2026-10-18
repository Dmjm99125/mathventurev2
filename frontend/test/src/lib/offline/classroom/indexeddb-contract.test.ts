import { assertEquals } from 'jsr:@std/assert';
import {
  createIndexedDbStore,
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
} from '../../../../../src/lib/offline/classroom/store.ts';

Deno.test('IndexedDB adapter exposes the classroom database contract', () => {
  assertEquals(OFFLINE_DB_NAME, 'mathventure-classroom');
  assertEquals(OFFLINE_DB_VERSION, 1);
  assertEquals(typeof createIndexedDbStore().get, 'function');
});

Deno.test('IndexedDB transactions include every requested classroom store', async () => {
  const transactions: { stores: string | string[]; mode: string }[] = [];
  const records = new Map<string, Map<string, Record<string, unknown>>>();
  const root = globalThis as typeof globalThis & { indexedDB?: unknown };
  const previousIndexedDb = root.indexedDB;
  const request = (result: unknown, apply?: () => void) => {
    let success: (() => void) | null = null;
    const pending = { result, error: null } as Record<string, unknown>;
    Object.defineProperty(pending, 'onsuccess', {
      set(handler: () => void) {
        success = handler;
        queueMicrotask(() => {
          apply?.();
          success?.();
        });
      },
    });
    Object.defineProperty(pending, 'onerror', { set: () => undefined });
    return pending;
  };
  const fakeDatabase = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => undefined,
    transaction(stores: string | string[], mode: string) {
      transactions.push({ stores, mode });
      let complete: (() => void) | null = null;
      let pendingRequests = 0;
      const transaction = {
        objectStore: (name: string) => {
          const recordsForStore = records.get(name) ?? new Map<string, Record<string, unknown>>();
          records.set(name, recordsForStore);
          return {
            get: (key: string) => {
              pendingRequests += 1;
              return request(recordsForStore.get(key), () => { pendingRequests -= 1; });
            },
            getAll: () => {
              pendingRequests += 1;
              return request(Array.from(recordsForStore.values()), () => { pendingRequests -= 1; });
            },
            put: (record: Record<string, unknown>) => {
              pendingRequests += 1;
              return request(undefined, () => {
                recordsForStore.set(String(record.key), record);
                pendingRequests -= 1;
              });
            },
            delete: (key: string) => {
              pendingRequests += 1;
              return request(undefined, () => {
                recordsForStore.delete(key);
                pendingRequests -= 1;
              });
            },
          };
        },
        error: null,
        onerror: null,
        onabort: null,
      } as Record<string, unknown>;
      Object.defineProperty(transaction, 'oncomplete', {
        set(handler: () => void) {
          complete = handler;
          if (pendingRequests === 0) queueMicrotask(() => complete?.());
        },
      });
      return transaction;
    },
    close: () => undefined,
  };
  const fakeIndexedDb = {
    open: () => {
      let upgrade: (() => void) | null = null;
      let success: (() => void) | null = null;
      const request = {
        result: fakeDatabase,
        error: null,
      } as Record<string, unknown>;
      Object.defineProperty(request, 'onupgradeneeded', {
        set(handler: () => void) { upgrade = handler; },
      });
      Object.defineProperty(request, 'onsuccess', {
        set(handler: () => void) {
          success = handler;
          upgrade?.();
          queueMicrotask(() => success?.());
        },
      });
      Object.defineProperty(request, 'onerror', { set: () => undefined });
      Object.defineProperty(request, 'onblocked', { set: () => undefined });
      return request;
    },
  };

  root.indexedDB = fakeIndexedDb;
  try {
    await createIndexedDbStore('transaction-contract').transaction(['assignments', 'outbox'], async (transactionStore) => {
      await transactionStore.put('assignments', { key: 'assignment-1', value: { id: 'assignment-1' } });
      await transactionStore.put('outbox', { key: 'operation-1', value: { operationId: 'operation-1' } });
    });
  } finally {
    if (previousIndexedDb === undefined) delete root.indexedDB;
    else root.indexedDB = previousIndexedDb;
  }

  assertEquals(transactions, [{ stores: ['assignments', 'outbox'], mode: 'readwrite' }]);
  assertEquals(records.get('assignments')?.get('assignment-1')?.value, { id: 'assignment-1' });
  assertEquals(records.get('outbox')?.get('operation-1')?.value, { operationId: 'operation-1' });
});
