import { assertEquals } from 'jsr:@std/assert';
import { offlineStatusReducer, type OfflineLifecycleState } from '../../../../../src/lib/offline/classroom/status.ts';

Deno.test('offline lifecycle moves from offline to syncing to online', () => {
  const initial: OfflineLifecycleState = {
    status: 'offline',
    pendingCount: 2,
    failedCount: 0,
    lastSyncedAt: null,
    error: null,
  };
  const syncing = offlineStatusReducer(initial, { type: 'sync-start' });
  const online = offlineStatusReducer(syncing, {
    type: 'sync-success',
    pendingCount: 0,
    failedCount: 0,
    lastSyncedAt: '2026-10-07T00:00:00.000Z',
  });

  assertEquals(syncing.status, 'syncing');
  assertEquals(online, {
    status: 'online',
    pendingCount: 0,
    failedCount: 0,
    lastSyncedAt: '2026-10-07T00:00:00.000Z',
    error: null,
  });
});
