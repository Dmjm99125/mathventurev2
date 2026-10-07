import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import { syncOutbox } from '../../../../../src/lib/offline/classroom/sync.ts';

Deno.test('sync sends dependent operations in order and clears acknowledgements', async () => {
  let nextId = 0;
  const repository = createOfflineRepository(
    createMemoryStore(),
    () => '2026-10-07T00:00:00.000Z',
    () => `operation-${++nextId}`,
  );
  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'assignment.create',
    entityId: 'assignment-1',
    payload: { name: 'Colors' },
    dependencies: [],
  });
  await repository.applyMutation({
    actorId: 'teacher-1',
    type: 'assignment.update',
    entityId: 'assignment-1',
    payload: { name: 'Updated colors' },
    dependencies: ['operation-1'],
  });

  const sent: string[] = [];
  await syncOutbox(repository, async (operations) => {
    sent.push(...operations.map((operation) => operation.operationId));
    return operations.map((operation) => ({ operationId: operation.operationId, status: 'accepted' as const }));
  });

  assertEquals(sent, ['operation-1', 'operation-2']);
  assertEquals(await repository.getOutbox(), []);
});
