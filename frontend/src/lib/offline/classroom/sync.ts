import type { OfflineOutboxOperation } from './types.ts';
import type { OfflineRepository } from './repository.ts';

export type OfflineSyncResult = {
  operationId: string;
  status: 'accepted' | 'duplicate' | 'rejected' | 'retryable';
  error?: string;
  result?: unknown;
};

export type SyncProgress = {
  completed: number;
  remaining: number;
  failed: number;
};

export type SyncBatchSender = (operations: OfflineOutboxOperation[]) => Promise<OfflineSyncResult[]>;

function dependenciesAreAcknowledged(
  operation: OfflineOutboxOperation,
  pendingIds: Set<string>,
): boolean {
  return operation.dependencies.every((dependency) => !pendingIds.has(dependency));
}

export async function syncOutbox(
  repository: OfflineRepository,
  sendBatch: SyncBatchSender,
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncProgress> {
  let completed = 0;
  let failed = 0;
  while (true) {
    const operations = await repository.getOutbox();
    const active = operations.filter((operation) => operation.status !== 'failed');
    const pendingIds = new Set(active.map((operation) => operation.operationId));
    const eligible = active
      .filter((operation) => dependenciesAreAcknowledged(operation, pendingIds))
      .slice(0, 50);
    if (eligible.length === 0) {
      const blocked = operations.filter((operation) => operation.status !== 'failed');
      for (const operation of blocked) {
        await repository.updateOutbox(operation.operationId, {
          status: 'failed',
          attemptCount: operation.attemptCount + 1,
          lastError: 'The operation is blocked by an unresolved dependency.',
        });
        failed += 1;
      }
      const finalProgress = { completed, remaining: 0, failed };
      onProgress?.(finalProgress);
      return finalProgress;
    }

    for (const operation of eligible) {
      await repository.updateOutbox(operation.operationId, {
        status: 'syncing',
        attemptCount: operation.attemptCount + 1,
      });
    }
    let results: OfflineSyncResult[];
    try {
      results = await sendBatch(eligible);
    } catch {
      for (const operation of eligible) {
        await repository.updateOutbox(operation.operationId, {
          status: 'failed',
          lastError: 'The sync request failed before the server acknowledged it.',
        });
        failed += 1;
      }
      const finalProgress = { completed, remaining: (await repository.getOutbox()).length, failed };
      onProgress?.(finalProgress);
      return finalProgress;
    }
    const byId = new Map(results.map((result) => [result.operationId, result]));
    for (const operation of eligible) {
      const result = byId.get(operation.operationId);
      if (!result || result.status === 'retryable') {
        await repository.updateOutbox(operation.operationId, {
          status: 'pending',
          lastError: result?.error ?? 'The server did not return a result for this operation.',
        });
        continue;
      }
      if (result.status === 'accepted' || result.status === 'duplicate') {
        await repository.deleteOutbox(operation.operationId);
        completed += 1;
      } else {
        await repository.updateOutbox(operation.operationId, {
          status: 'failed',
          lastError: result.error ?? 'The server rejected this operation.',
        });
        failed += 1;
      }
    }
    const progress = { completed, remaining: (await repository.getOutbox()).length, failed };
    onProgress?.(progress);
    if (progress.remaining === 0) return progress;
  }
}
