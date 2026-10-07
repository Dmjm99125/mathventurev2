export type SnapshotRow = {
  id: string;
  [key: string]: unknown;
};

export type OfflineSnapshot = {
  revision: number;
  assignments: SnapshotRow[];
  [collection: string]: unknown;
};

export type PendingOperationReference = {
  entityId: string;
  status: 'pending' | 'syncing' | 'failed';
};

export type MergedOfflineSnapshot = OfflineSnapshot & {
  lastSyncedAt: string;
};

export function mergeOfflineSnapshot(
  snapshot: OfflineSnapshot,
  localCollections: Record<string, SnapshotRow[]>,
  pendingOperations: PendingOperationReference[],
): MergedOfflineSnapshot {
  const pendingEntityIds = new Set(
    pendingOperations
      .filter((operation) => operation.status !== 'syncing')
      .map((operation) => operation.entityId),
  );
  const merged: Record<string, unknown> = {
    ...snapshot,
    lastSyncedAt: new Date().toISOString(),
  };

  for (const [collectionName, localRows] of Object.entries(localCollections)) {
    const serverRows = Array.isArray(snapshot[collectionName])
      ? snapshot[collectionName] as SnapshotRow[]
      : [];
    const serverIds = new Set(serverRows.map((row) => row.id));
    const preservedLocalRows = localRows.filter(
      (row) => pendingEntityIds.has(row.id) && !serverIds.has(row.id),
    );
    merged[collectionName] = [...serverRows, ...preservedLocalRows];
  }

  return merged as MergedOfflineSnapshot;
}
