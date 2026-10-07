import { assertEquals } from 'jsr:@std/assert';
import { createOfflineSyncHandler } from '../../../../supabase/functions/offline-sync/handler.ts';

Deno.test('offline sync returns the stored result for duplicate operations', async () => {
  let applied = false;
  const handler = createOfflineSyncHandler({
    getAuthedProfile: async () => ({
      id: 'teacher-1',
      role: 'teacher',
      full_name: 'Teacher',
    }),
    readStoredOperation: async () => ({
      status: 'applied',
      result: { assignmentId: 'assignment-1' },
    }),
    applyOperation: async () => {
      applied = true;
      return { status: 'accepted', result: {} };
    },
    recordOperation: async () => {},
  });

  const response = await handler(new Request('http://local/offline-sync', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: 'device-1',
      operations: [{
        operationId: 'operation-1',
        deviceId: 'device-1',
        actorId: 'teacher-1',
        type: 'assignment.create',
        entityId: 'assignment-1',
        payload: { classId: 'class-1' },
        dependencies: [],
        createdAt: '2026-10-07T00:00:00.000Z',
      }],
    }),
  }));
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(applied, false);
  assertEquals(body.results, [{
    operationId: 'operation-1',
    status: 'duplicate',
    result: { assignmentId: 'assignment-1' },
  }]);
});
