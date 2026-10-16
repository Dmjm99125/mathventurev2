import { assertEquals } from 'jsr:@std/assert';
import { recordFreePlayCompletion } from '../../../../../src/lib/offline/classroom/freePlay.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';

Deno.test('Free Play completion is stored in SQLite and queued for sync', async () => {
  const repository = createOfflineRepository(
    await createMemorySqlite(),
    () => '2026-10-16T00:00:00.000Z',
    (() => {
      let next = 0;
      return () => `id-${++next}`;
    })(),
    'device-1',
  );

  await recordFreePlayCompletion(repository, 'student-1', {
    gameId: 'colors',
    score: 8,
    maxScore: 10,
  }, () => 'session-1');

  const progress = await repository.readCollection('freePlayProgress');
  const outbox = await repository.getOutbox();
  assertEquals(progress.length, 1);
  assertEquals(progress[0].best_score, 8);
  assertEquals(outbox.at(-1)?.type, 'freePlay.complete');
  assertEquals(outbox.length, 2);
  assertEquals(outbox.at(-1)?.dependencies.length, 1);
});
