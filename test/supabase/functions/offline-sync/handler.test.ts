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

Deno.test('offline sync permits a cached classroom student actor after teacher authorization', async () => {
  let appliedActor = '';
  const handler = createOfflineSyncHandler({
    getAuthedProfile: async () => ({ id: 'teacher-1', role: 'teacher', full_name: 'Teacher' }),
    isActorAllowed: async (actorId, teacherId) => actorId === 'student-1' && teacherId === 'teacher-1',
    readStoredOperation: async () => null,
    applyOperation: async (_teacherId, operation) => {
      appliedActor = operation.actorId;
      return { status: 'accepted', result: { saved: true } };
    },
    recordOperation: async () => {},
  });
  const response = await handler(new Request('http://local/offline-sync', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: 'device-1',
      operations: [{
        operationId: 'student-operation-1', deviceId: 'device-1', actorId: 'student-1',
        type: 'attempt.submit', entityId: 'attempt-1',
        payload: { lessonId: 'lesson-1', score: 1, maxScore: 1, gameResults: [] },
        dependencies: [], createdAt: '2026-10-07T00:00:00.000Z',
      }],
    }),
  }));
  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(appliedActor, 'student-1');
  assertEquals(body.results[0].status, 'accepted');
});
