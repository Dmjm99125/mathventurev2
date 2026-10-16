import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';

Deno.test('local mutation is visible immediately and creates one pending outbox entry', async () => {
  const repository = createOfflineRepository(
    createMemoryStore(),
    () => '2026-10-07T00:00:00.000Z',
    () => 'id-1',
  );

  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'assignment.create',
    entityId: 'assignment-1',
    payload: { id: 'assignment-1', name: 'Colors' },
    dependencies: [],
  });

  assertEquals(await repository.readByKey('assignments', 'assignment-1'), {
    id: 'assignment-1',
    name: 'Colors',
  });
  assertEquals((await repository.getOutbox()).map((operation) => operation.operationId), ['id-1']);
});

Deno.test('sqlite mutation is visible and queued in one transaction', async () => {
  const database = await createMemorySqlite();
  const repository = createOfflineRepository(
    database,
    () => '2026-10-16T00:00:00.000Z',
    () => 'op-1',
    'device-1',
  );

  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'assignment.create',
    entityId: 'assignment-1',
    payload: { name: 'Practice' },
    dependencies: [],
  });

  assertEquals((await repository.readByKey('assignments', 'assignment-1'))?.name, 'Practice');
  assertEquals((await repository.getOutbox()).map((operation) => operation.operationId), ['op-1']);
  assertEquals(await database.query('select operation_id from sync_outbox'), [{ operation_id: 'op-1' }]);
});

Deno.test('resolving a server conflict removes only its operation and keeps unrelated work', async () => {
  const repository = createOfflineRepository(
    createMemoryStore(),
    () => '2026-10-16T00:00:00.000Z',
    (() => {
      let next = 0;
      return () => `op-${++next}`;
    })(),
  );
  await repository.applyMutation({ actorId: 'teacher-1', type: 'assignment.create', entityId: 'assignment-1', payload: {}, dependencies: [] });
  await repository.applyMutation({ actorId: 'teacher-1', type: 'post.create', entityId: 'post-1', payload: {}, dependencies: [] });
  await repository.recordConflict({ conflictId: 'conflict-1', operationId: 'op-1', entityType: 'assignment.create', entityId: 'assignment-1', local: {}, server: {}, message: 'changed', status: 'open' });
  await repository.resolveConflict('conflict-1', 'server');
  assertEquals((await repository.getOutbox()).map((operation) => operation.operationId), ['op-2']);
  assertEquals(await repository.listConflicts(), []);
  assertEquals(await repository.readMeta('conflict:conflict-1'), { choice: 'server', resolvedAt: '2026-10-16T00:00:00.000Z' });
});
