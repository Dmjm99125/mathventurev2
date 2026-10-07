import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';

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
