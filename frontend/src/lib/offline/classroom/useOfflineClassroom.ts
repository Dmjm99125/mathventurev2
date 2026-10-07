import { createContext, createElement, useContext, useEffect, useMemo, useReducer, useCallback, type ReactNode } from 'react';
import { createIndexedDbStore } from './store.ts';
import { createOfflineRepository, type OfflineRepository } from './repository.ts';
import { bootstrapRepository, downloadClassroomPack } from './bootstrap.ts';
import { syncOfflineClassroom } from './index.ts';
import { offlineStatusReducer, type OfflineLifecycleState } from './status.ts';
import type { BootstrapInvoker } from './bootstrap.ts';
import { getOrCreateDeviceId } from './crypto.ts';

const initialState: OfflineLifecycleState = {
  status: typeof navigator !== 'undefined' && (navigator as Navigator & { onLine?: boolean }).onLine === false ? 'offline' : 'online',
  pendingCount: 0,
  failedCount: 0,
  lastSyncedAt: null,
  error: null,
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
  const resolvedRepository = useMemo(
    () => {
      if (repository) return repository;
      const storage = typeof window === 'undefined' ? undefined : window.localStorage;
      const deviceId = storage ? getOrCreateDeviceId(storage) : 'local-device';
      return createOfflineRepository(createIndexedDbStore(), undefined, undefined, deviceId);
    },
    [repository],
  );
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
  }, [invoke, resolvedRepository]);
  useEffect(() => {
    const onOnline = () => { dispatch({ type: 'network-online' }); void syncNow(); };
    const onOffline = () => dispatch({ type: 'network-offline' });
    addEventListener('online', onOnline);
    addEventListener('offline', onOffline);
    void resolvedRepository.getSyncSummary().then((summary) => dispatch({ type: 'counts', ...summary }));
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
