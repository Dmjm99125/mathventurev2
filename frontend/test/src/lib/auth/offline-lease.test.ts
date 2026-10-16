import { assert, assertEquals, assertThrows } from 'jsr:@std/assert';
import { isOfflineLeaseValid, renewOfflineLease } from '../../../../src/lib/offline/classroom/lease.ts';
import type { OfflineEnrollmentRecord } from '../../../../src/lib/offline/classroom/lease.ts';

function enrollmentAt(lastOnlineValidatedAt: string): OfflineEnrollmentRecord {
  return {
    deviceId: 'device-1',
    verifier: {
      algorithm: 'PBKDF2-SHA-256',
      iterations: 120_000,
      salt: 'salt',
      verifier: 'verifier',
    },
    profile: { id: 'teacher-1', role: 'teacher', full_name: 'Teacher' },
    lastOnlineValidatedAt,
    offlineAccessUntil: '2026-10-17T12:00:00.000Z',
  };
}

Deno.test('online validation renews a sliding seven-day lease', () => {
  const next = renewOfflineLease('2026-10-16T12:00:00.000Z', enrollmentAt('2026-10-10T12:00:00.000Z'));

  assertEquals(next.lastOnlineValidatedAt, '2026-10-16T12:00:00.000Z');
  assertEquals(next.offlineAccessUntil, '2026-10-23T12:00:00.000Z');
  assert(isOfflineLeaseValid('2026-10-23T11:59:59.999Z', next));
  assert(!isOfflineLeaseValid('2026-10-23T12:00:00.000Z', next));
});

Deno.test('lease arithmetic rejects invalid timestamps instead of granting access', () => {
  assertThrows(() => renewOfflineLease('not-a-date', enrollmentAt('2026-10-10T12:00:00.000Z')));
  assert(!isOfflineLeaseValid('2026-10-16T12:00:00.000Z', enrollmentAt('not-a-date')));
});
