import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';
import {
  OfflineDurableStorageError,
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
