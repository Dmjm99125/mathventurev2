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
  const pendingEntityIds = new Set(pendingOperations.map((operation) => operation.entityId));
  const merged: Record<string, unknown> = {
    ...snapshot,
    lastSyncedAt: new Date().toISOString(),
  };

  for (const [collectionName, localRows] of Object.entries(localCollections)) {
    const serverRows = Array.isArray(snapshot[collectionName])
      ? snapshot[collectionName] as SnapshotRow[]
      : [];
    const localPendingRows = localRows.filter((row) => pendingEntityIds.has(row.id));
    const localPendingIds = new Set(localPendingRows.map((row) => row.id));
    merged[collectionName] = [
      ...serverRows.filter((row) => !localPendingIds.has(row.id)),
      ...localPendingRows,
    ];
  }

  return merged as MergedOfflineSnapshot;
}
