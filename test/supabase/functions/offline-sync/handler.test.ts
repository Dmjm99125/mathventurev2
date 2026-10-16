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

Deno.test('offline sync returns independent results for malformed and valid batch members', async () => {
  let applied = 0;
  const handler = createOfflineSyncHandler({
    getAuthedProfile: async () => ({ id: 'teacher-1', role: 'teacher', full_name: 'Teacher' }),
    readStoredOperation: async () => null,
    applyOperation: async () => {
      applied += 1;
      return { status: 'accepted', result: { saved: true } };
    },
    recordOperation: async () => {},
  });
  const response = await handler(new Request('http://local/offline-sync', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: 'device-1',
      operations: [
        { operationId: 'bad', deviceId: 'device-1', actorId: 'teacher-1', type: 'unknown', entityId: 'bad', payload: {}, dependencies: [], createdAt: '2026-10-07T00:00:00.000Z' },
        { operationId: 'good', deviceId: 'device-1', actorId: 'teacher-1', type: 'class.ensure', entityId: 'class-1', payload: {}, dependencies: [], createdAt: '2026-10-07T00:00:00.000Z' },
      ],
    }),
  }));
  const body = await response.json();
  assertEquals(applied, 1);
  assertEquals(body.results.map((result: { status: string }) => result.status), ['rejected', 'accepted']);
});

Deno.test('offline sync does not store retryable operations as acknowledged', async () => {
  let recorded = 0;
  const handler = createOfflineSyncHandler({
    getAuthedProfile: async () => ({ id: 'teacher-1', role: 'teacher', full_name: 'Teacher' }),
    readStoredOperation: async () => null,
    applyOperation: async () => ({ status: 'retryable', error: 'Try again later.' }),
    recordOperation: async () => { recorded += 1; },
  });
  const response = await handler(new Request('http://local/offline-sync', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: 'device-1',
      operations: [{ operationId: 'retry', deviceId: 'device-1', actorId: 'teacher-1', type: 'class.ensure', entityId: 'class-1', payload: {}, dependencies: [], createdAt: '2026-10-07T00:00:00.000Z' }],
    }),
  }));
  const body = await response.json();
  assertEquals(recorded, 0);
  assertEquals(body.results[0].status, 'retryable');
});

Deno.test('offline sync preserves a conflict result without hiding a later valid operation', async () => {
  const recorded: string[] = [];
  const handler = createOfflineSyncHandler({
    getAuthedProfile: async () => ({ id: 'teacher-1', role: 'teacher', full_name: 'Teacher' }),
    readStoredOperation: async () => null,
    applyOperation: async (_teacherId, operation) => operation.operationId === 'conflict'
      ? { status: 'conflict', error: 'Server changed this assignment.', result: { server: { id: operation.entityId } } }
      : { status: 'accepted', result: { saved: true } },
    recordOperation: async (_teacherId, operation, execution) => { recorded.push(`${operation.operationId}:${execution.status}`); },
  });
  const response = await handler(new Request('http://local/offline-sync', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: 'device-1',
      operations: [
        { operationId: 'conflict', deviceId: 'device-1', actorId: 'teacher-1', type: 'assignment.update', entityId: 'assignment-1', payload: {}, dependencies: [], createdAt: '2026-10-07T00:00:00.000Z' },
        { operationId: 'accepted', deviceId: 'device-1', actorId: 'teacher-1', type: 'class.ensure', entityId: 'class-1', payload: {}, dependencies: [], createdAt: '2026-10-07T00:00:00.000Z' },
      ],
    }),
  }));
  const body = await response.json();
  assertEquals(body.results.map((result: { status: string }) => result.status), ['conflict', 'accepted']);
  assertEquals(recorded, ['conflict:conflict', 'accepted:accepted']);
});
