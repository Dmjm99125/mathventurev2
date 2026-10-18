import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';
import {
  OfflineDurableStorageError,
  openApplicationStorage,
  openApplicationDatabase,
} from '../../../../../src/lib/offline/sqlite/runtime.ts';

Deno.test('runtime opens durable SQLite when the browser declines persistent-storage protection', async () => {
  let receivedQuality: string | undefined;
  const memory = await createMemorySqlite();
  const database = await openApplicationDatabase({
    storage: { persist: async () => false },
    databaseFactory: async ({ quality }) => {
      receivedQuality = quality;
      return {
        ...memory,
        health: async () => ({ schemaVersion: 1, durable: true, quality }),
      };
    },
  });

  assertEquals(receivedQuality, 'best-effort');
  assertEquals((await database.health()).durable, true);
});

Deno.test('runtime opens the injected durable database after persistence is granted', async () => {
  const memory = await createMemorySqlite();

  const database = await openApplicationDatabase({
    storage: { persist: async () => true },
    databaseFactory: async () => ({
      ...memory,
      health: async () => ({
        schemaVersion: 1,
        durable: true,
        quality: 'persistent' as const,
      }),
    }),
  });

  assertEquals((await database.health()).schemaVersion, 1);
});

Deno.test('runtime closes a database that fails its durable-health check', async () => {
  const memory = await createMemorySqlite();
  let closed = false;

  await assertRejects(
    () => openApplicationDatabase({
      storage: { persist: async () => false },
      databaseFactory: async () => ({
        ...memory,
        health: async () => ({ schemaVersion: 1, durable: false, quality: 'best-effort' as const }),
        close: async () => { closed = true; },
      }),
    }),
    OfflineDurableStorageError,
  );

  assertEquals(closed, true);
});

Deno.test('runtime preserves the underlying browser SQLite error for diagnostics', async () => {
  let caught: unknown;
  try {
    await openApplicationDatabase({
      storage: { persist: async () => false },
      databaseFactory: async () => {
        throw new Error('SQLite OPFS is unavailable. Enable cross-origin isolation.');
      },
    });
  } catch (error) {
    caught = error;
  }

  if (!(caught instanceof Error)) throw new Error('Expected SQLite startup to reject with an Error.');
  assertStringIncludes(caught.message, 'The offline SQLite database could not be opened.');
  assertStringIncludes(caught.message, 'SQLite OPFS is unavailable. Enable cross-origin isolation.');
});

Deno.test('runtime falls back to durable IndexedDB storage when browser OPFS is unavailable', async () => {
  const fallbackStore = createMemoryStore();
  const storage = await openApplicationStorage({
    storage: { persist: async () => false },
    databaseFactory: async () => {
      throw new Error('SQLite OPFS is unavailable. Enable a supported browser and cross-origin isolation.');
    },
    fallbackStoreFactory: () => fallbackStore,
  });

  assertEquals(storage, fallbackStore);
});

Deno.test('Tauri runtime bypasses browser persistence checks', async () => {
  const memory = await createMemorySqlite();
  const database = await openApplicationDatabase({
    runtime: 'tauri',
    storage: { persist: async () => { throw new Error('must not be called'); } },
    databaseFactory: async ({ quality }) => ({
      ...memory,
      health: async () => ({ schemaVersion: 1, durable: true, quality }),
    }),
  });

  assertEquals((await database.health()).quality, 'native');
});
