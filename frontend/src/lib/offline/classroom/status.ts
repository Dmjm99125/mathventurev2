import type { OfflineSyncStatus } from './types.ts';

export type OfflineLifecycleState = {
  status: OfflineSyncStatus;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
  error: string | null;
  leaseExpiresAt?: string | null;
  storage?: 'healthy' | 'best-effort' | 'unavailable' | 'unknown';
};

export type OfflineLifecycleAction =
  | { type: 'network-online' }
  | { type: 'network-offline' }
  | { type: 'sync-start' }
  | { type: 'sync-success'; pendingCount: number; failedCount: number; lastSyncedAt: string | null }
  | { type: 'sync-error'; error: string; pendingCount: number; failedCount: number }
  | { type: 'needs-auth' }
  | { type: 'counts'; pendingCount: number; failedCount: number }
  | { type: 'lease-update'; leaseExpiresAt: string | null }
  | { type: 'storage-health'; storage: 'healthy' | 'best-effort' | 'unavailable' | 'unknown' };

export function offlineStatusReducer(
  state: OfflineLifecycleState,
  action: OfflineLifecycleAction,
): OfflineLifecycleState {
  switch (action.type) {
    case 'network-online':
      return { ...state, status: state.pendingCount ? 'online' : 'online', error: null };
    case 'network-offline':
      return { ...state, status: 'offline', error: null };
    case 'sync-start':
      return { ...state, status: 'syncing', error: null };
    case 'sync-success':
      return { ...state, status: 'online', pendingCount: action.pendingCount, failedCount: action.failedCount, lastSyncedAt: action.lastSyncedAt, error: null };
    case 'sync-error':
      return { ...state, status: 'error', pendingCount: action.pendingCount, failedCount: action.failedCount, error: action.error };
    case 'needs-auth':
      return { ...state, status: 'needs-auth' };
    case 'counts':
      return { ...state, pendingCount: action.pendingCount, failedCount: action.failedCount };
    case 'lease-update':
      return { ...state, leaseExpiresAt: action.leaseExpiresAt };
    case 'storage-health':
      return { ...state, storage: action.storage };
  }
}
