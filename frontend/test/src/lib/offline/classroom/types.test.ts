import { assert, assertEquals } from 'jsr:@std/assert';
import {
  isOfflineOutboxOperation,
  isOfflineSyncStatus,
  type OfflineOutboxOperation,
} from '../../../../../src/lib/offline/classroom/types.ts';

Deno.test('offline contracts accept a queued assignment operation', () => {
  const operation: OfflineOutboxOperation = {
    operationId: 'op-1',
    deviceId: 'device-1',
    actorId: 'teacher-1',
    type: 'assignment.create',
    entityId: 'assignment-1',
    payload: { lessonId: 'colors', classId: 'class-1', name: 'Colors' },
    dependencies: [],
    createdAt: '2026-10-07T00:00:00.000Z',
    status: 'pending',
    attemptCount: 0,
    lastError: null,
  };

  assert(isOfflineOutboxOperation(operation));
  assert(isOfflineSyncStatus('offline'));
  assertEquals(isOfflineSyncStatus('broken'), false);
});
