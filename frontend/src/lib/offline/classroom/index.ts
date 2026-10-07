import type { BootstrapInvoker } from './bootstrap.ts';
import { syncOutbox, type OfflineSyncResult, type SyncProgress } from './sync.ts';
import type { OfflineRepository } from './repository.ts';
import type { OfflineOutboxOperation } from './types.ts';

export type ClassroomApiSurface = Record<string, Record<string, (...args: any[]) => Promise<any>>>;

export type OfflineAwareApiOptions<T extends ClassroomApiSurface> = {
  isOnline?: () => boolean;
  onlineApi: T;
  localApi: T;
};

const readMethods = new Set(['list', 'get', 'overview', 'classDetail', 'roster', 'rosterStudent']);

export function createOfflineAwareApi<T extends ClassroomApiSurface>({
  isOnline = () => typeof navigator === 'undefined' || (navigator as Navigator & { onLine?: boolean }).onLine !== false,
  onlineApi,
  localApi,
}: OfflineAwareApiOptions<T>): T {
  const resources = new Set([...Object.keys(onlineApi), ...Object.keys(localApi)]);
  const gateway: ClassroomApiSurface = {};
  for (const resource of resources) {
    const methods = new Set([
      ...Object.keys(onlineApi[resource] ?? {}),
      ...Object.keys(localApi[resource] ?? {}),
    ]);
    gateway[resource] = {};
    for (const method of methods) {
      const onlineMethod = onlineApi[resource]?.[method];
      const localMethod = localApi[resource]?.[method];
      gateway[resource][method] = (...args: any[]) => {
        const implementation = readMethods.has(method) && isOnline() ? onlineMethod : localMethod;
        if (!implementation) throw new Error(`Offline classroom method ${resource}.${method} is unavailable.`);
        return implementation(...args);
      };
    }
  }
  return gateway as T;
}

export async function syncOfflineClassroom(
  repository: OfflineRepository,
  invoke: BootstrapInvoker,
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncProgress> {
  const operations = await repository.getOutbox();
  if (operations.length === 0) {
    const empty = { completed: 0, remaining: 0, failed: 0 };
    onProgress?.(empty);
    return empty;
  }
  return syncOutbox(repository, async (batch: OfflineOutboxOperation[]) => {
    const deviceId = batch[0]?.deviceId;
    if (!deviceId) return [];
    const response = await invoke('offline-sync', {
      method: 'POST',
      body: { deviceId, operations: batch },
    });
    if (!response || typeof response !== 'object' || !Array.isArray((response as { results?: unknown }).results)) {
      throw new Error('The offline sync response is invalid.');
    }
    return (response as { results: OfflineSyncResult[] }).results;
  }, onProgress);
}
