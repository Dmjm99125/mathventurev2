import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';
import {
  OfflineDurableStorageError,
  openApplicationDatabase,
} from '../../../../../src/lib/offline/sqlite/runtime.ts';

Deno.test('runtime rejects an environment that denies persistent storage', async () => {
  let factoryCalled = false;

  await assertRejects(
    () => openApplicationDatabase({
      storage: { persist: async () => false },
      databaseFactory: async () => {
        factoryCalled = true;
        return createMemorySqlite();
      },
    }),
    OfflineDurableStorageError,
  );

  assertEquals(factoryCalled, false);
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
      }),
    }),
  });

  assertEquals((await database.health()).schemaVersion, 1);
});
