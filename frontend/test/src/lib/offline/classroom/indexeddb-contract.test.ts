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
  const root = globalThis as typeof globalThis & { indexedDB?: unknown };
  const previousIndexedDb = root.indexedDB;
  const fakeDatabase = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => undefined,
    transaction(stores: string | string[], mode: string) {
      transactions.push({ stores, mode });
      let complete: (() => void) | null = null;
      const transaction = {
        objectStore: () => ({
          get: () => ({ result: undefined, error: null, onsuccess: null, onerror: null }),
          getAll: () => ({ result: [], error: null, onsuccess: null, onerror: null }),
          put: () => ({ result: undefined, error: null, onsuccess: null, onerror: null }),
          delete: () => ({ result: undefined, error: null, onsuccess: null, onerror: null }),
        }),
        error: null,
        onerror: null,
        onabort: null,
      } as Record<string, unknown>;
      Object.defineProperty(transaction, 'oncomplete', {
        set(handler: () => void) {
          complete = handler;
          queueMicrotask(() => complete?.());
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
    await createIndexedDbStore('transaction-contract').transaction(['assignments', 'outbox'], async () => {});
  } finally {
    if (previousIndexedDb === undefined) delete root.indexedDB;
    else root.indexedDB = previousIndexedDb;
  }

  assertEquals(transactions, [{ stores: ['assignments', 'outbox'], mode: 'readwrite' }]);
});
