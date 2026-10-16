import { assertEquals } from 'jsr:@std/assert';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';

Deno.test('SQLite lifecycle opens one application database and closes it on disposal', async () => {
  const database = await createMemorySqlite();
  let closeCount = 0;
  const originalClose = database.close;
  database.close = async () => {
    closeCount += 1;
    await originalClose();
  };
  const repository = createOfflineRepository(database);
  assertEquals((await repository.getSyncSummary()).pendingCount, 0);
  await database.close();
  assertEquals(closeCount, 1);
});
