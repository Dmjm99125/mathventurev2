import { createContext, createElement, useContext, useEffect, useMemo, useReducer, useCallback, useState, type ReactNode } from 'react';
import { createOfflineRepository, type OfflineRepository } from './repository.ts';
import { bootstrapRepository, downloadClassroomPack } from './bootstrap.ts';
import { syncOfflineClassroom } from './index.ts';
import { offlineStatusReducer, type OfflineLifecycleState } from './status.ts';
import type { BootstrapInvoker } from './bootstrap.ts';
import { getOrCreateDeviceId } from './crypto.ts';
import { getApplicationDatabase, resetApplicationDatabaseForTests } from '../sqlite/runtime.ts';
import type { SqliteDatabase } from '../sqlite/adapter.ts';

const initialState: OfflineLifecycleState = {
  status: typeof navigator !== 'undefined' && (navigator as Navigator & { onLine?: boolean }).onLine === false ? 'offline' : 'online',
  pendingCount: 0,
  failedCount: 0,
  lastSyncedAt: null,
  error: null,
  leaseExpiresAt: null,
  storage: 'healthy',
};

type OfflineClassroomContextValue = OfflineLifecycleState & {
  repository: OfflineRepository;
  bootstrapNow: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const OfflineClassroomContext = createContext<OfflineClassroomContextValue | null>(null);

export function OfflineClassroomProvider({ children, repository, invoke }: {
  children: ReactNode;
  repository?: OfflineRepository;
  invoke?: BootstrapInvoker;
}) {
  const [state, dispatch] = useReducer(offlineStatusReducer, initialState);
  const [database, setDatabase] = useState<SqliteDatabase | null>(null);
  const [storageError, setStorageError] = useState<Error | null>(null);
  const resolvedRepository = useMemo(() => {
    if (repository) return repository;
    if (!database) return null;
    const storage = typeof window === 'undefined' ? undefined : window.localStorage;
    const deviceId = storage ? getOrCreateDeviceId(storage) : 'local-device';
    return createOfflineRepository(database, undefined, undefined, deviceId);
  }, [database, repository]);
  useEffect(() => {
    if (repository) return;
    let active = true;
    void getApplicationDatabase()
      .then((opened) => {
        if (active) setDatabase(opened);
      })
      .catch((error: unknown) => {
        if (active) setStorageError(error instanceof Error ? error : new Error('Durable offline storage is unavailable.'));
      });
    return () => { active = false; };
  }, [repository]);
  useEffect(() => {
    if (repository || !database) return;
    return () => {
      void database.close().finally(() => resetApplicationDatabaseForTests());
    };
  }, [database, repository]);
  if (!resolvedRepository) {
    return createElement(
      'div',
      { role: 'alert', className: 'min-h-[100dvh] bg-background p-6 text-center text-foreground' },
      storageError
        ? `Offline storage could not be prepared. ${storageError.message}`
        : 'Preparing durable offline storage…',
    );
  }
  const syncNow = useCallback(async () => {
    dispatch({ type: 'sync-start' });
    try {
      const request = invoke ?? (async (name, options) => {
        const { invokeFunction } = await import('../../api/client.ts');
        return invokeFunction<unknown>(name, options);
      });
      const progress = await syncOfflineClassroom(resolvedRepository, request);
      const summary = await resolvedRepository.getSyncSummary();
      dispatch({ type: 'sync-success', pendingCount: summary.pendingCount, failedCount: summary.failedCount, lastSyncedAt: new Date().toISOString() });
      const leaseExpiresAt = await resolvedRepository.readMeta('offlineAccessUntil');
      if (typeof leaseExpiresAt === 'string') dispatch({ type: 'lease-update', leaseExpiresAt });
      void progress;
    } catch (error) {
      const summary = await resolvedRepository.getSyncSummary();
      dispatch({ type: 'sync-error', pendingCount: summary.pendingCount, failedCount: summary.failedCount, error: error instanceof Error ? error.message : 'Sync failed.' });
    }
  }, [invoke, resolvedRepository]);
  const bootstrapNow = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new Error('An internet connection is required to refresh the classroom pack.');
    }
    const request = invoke ?? (async (name, options) => {
      const { invokeFunction } = await import('../../api/client.ts');
      return invokeFunction<unknown>(name, options);
    });
    await bootstrapRepository(resolvedRepository, () => downloadClassroomPack(request));
    const summary = await resolvedRepository.getSyncSummary();
    dispatch({ type: 'sync-success', pendingCount: summary.pendingCount, failedCount: summary.failedCount, lastSyncedAt: new Date().toISOString() });
    const leaseExpiresAt = await resolvedRepository.readMeta('offlineAccessUntil');
    if (typeof leaseExpiresAt === 'string') dispatch({ type: 'lease-update', leaseExpiresAt });
  }, [invoke, resolvedRepository]);
  useEffect(() => {
    const onOnline = () => { dispatch({ type: 'network-online' }); void syncNow(); };
    const onOffline = () => dispatch({ type: 'network-offline' });
    addEventListener('online', onOnline);
    addEventListener('offline', onOffline);
    void resolvedRepository.getSyncSummary().then((summary) => dispatch({ type: 'counts', ...summary }));
    void resolvedRepository.readMeta('offlineAccessUntil').then((value) => {
      if (typeof value === 'string') dispatch({ type: 'lease-update', leaseExpiresAt: value });
    });
    return () => {
      removeEventListener('online', onOnline);
      removeEventListener('offline', onOffline);
    };
  }, [resolvedRepository, syncNow]);
  return createElement(OfflineClassroomContext.Provider, { value: { ...state, repository: resolvedRepository, bootstrapNow, syncNow } }, children);
}

export function useOfflineClassroom(): OfflineClassroomContextValue {
  const context = useContext(OfflineClassroomContext);
  if (!context) throw new Error('useOfflineClassroom must be used inside OfflineClassroomProvider.');
  return context;
}
