import type {
  OfflineBootstrapResponse,
  OfflineEntityName,
  OfflineOperationType,
  OfflineOutboxOperation,
} from './types.ts';
import type { OfflineRecord, OfflineStore } from './store.ts';
import { mergeOfflineSnapshot, type SnapshotRow } from './snapshot.ts';

const operationStores: Record<OfflineOperationType, OfflineEntityName> = {
  'class.ensure': 'classrooms',
  'class.addStudents': 'classStudents',
  'class.removeStudent': 'classStudents',
  'assignment.create': 'assignments',
  'assignment.update': 'assignments',
  'assignment.delete': 'assignments',
  'assignmentQuiz.start': 'attempts',
  'assignmentQuiz.checkpoint': 'attempts',
  'assignmentQuiz.complete': 'attempts',
  'attempt.submit': 'attempts',
  'post.create': 'posts',
};

export type OfflineMutationInput = {
  actorId: string;
  type: OfflineOperationType;
  entityId: string;
  payload: Record<string, unknown>;
  dependencies: string[];
};

export type OfflineRepository = {
  readCollection(store: OfflineEntityName): Promise<Record<string, unknown>[]>;
  readByKey(store: OfflineEntityName, key: string): Promise<Record<string, unknown> | undefined>;
  readMeta(key: string): Promise<unknown>;
  writeMeta(key: string, value: unknown): Promise<void>;
  putSnapshot(collection: OfflineEntityName, rows: Record<string, unknown>[]): Promise<void>;
  persistBootstrap(snapshot: OfflineBootstrapResponse): Promise<void>;
  applyMutation(input: OfflineMutationInput): Promise<OfflineOutboxOperation>;
  getOutbox(): Promise<OfflineOutboxOperation[]>;
  getSyncSummary(): Promise<{ pendingCount: number; failedCount: number }>;
};

function valueWithId(entityId: string, payload: Record<string, unknown>): Record<string, unknown> {
  return { id: entityId, ...payload };
}

function rowsWithIds(rows: Record<string, unknown>[], idForRow?: (row: Record<string, unknown>) => string | undefined) {
  return rows.flatMap((row) => {
    const id = typeof row.id === 'string' ? row.id : idForRow?.(row);
    return id ? [{ id, ...row }] : [];
  });
}

export function createOfflineRepository(
  store: OfflineStore,
  clock: () => string = () => new Date().toISOString(),
  idFactory: () => string = () => crypto.randomUUID(),
  deviceId = 'local-device',
): OfflineRepository {
  const readCollection = async (storeName: OfflineEntityName) => {
    const records = await store.getAll(storeName);
    return records.map((record) => record.value as Record<string, unknown>);
  };

  return {
    readCollection,
    async readByKey(storeName, key) {
      const record = await store.get(storeName, key);
      return record?.value as Record<string, unknown> | undefined;
    },
    async readMeta(key) {
      return (await store.get('meta', key))?.value;
    },
    async writeMeta(key, value) {
      await store.put('meta', { key, value });
    },
    async putSnapshot(collection, rows) {
      await store.transaction([collection], async () => {
        for (const row of rows) {
          if (typeof row.id !== 'string') continue;
          await store.put(collection, { key: row.id, value: row });
        }
      });
    },
    async persistBootstrap(snapshot) {
      const studentRows = rowsWithIds(snapshot.students, (row) => {
        return typeof row.student_id === 'string' ? row.student_id : undefined;
      });
      const profileRows = [
        {
          id: snapshot.teacher.id,
          role: snapshot.teacher.role,
          full_name: snapshot.teacher.fullName,
        },
        ...snapshot.students.flatMap((row) => {
          const profile = row.profiles;
          if (!profile || typeof profile !== 'object') return [];
          const value = profile as Record<string, unknown>;
          return typeof value.id === 'string' ? [value] : [];
        }),
      ];
      const classroomRows = snapshot.classroom ? [snapshot.classroom] : [];
      const serverCollections = {
        profiles: profileRows,
        classrooms: rowsWithIds(classroomRows),
        classStudents: studentRows,
        assignments: rowsWithIds(snapshot.assignments),
        attempts: rowsWithIds(snapshot.attempts),
        attemptGameResults: rowsWithIds(snapshot.gameResults),
        posts: rowsWithIds(snapshot.posts),
      } satisfies Record<string, Record<string, unknown>[]>;
      const collectionNames = Object.keys(serverCollections) as OfflineEntityName[];
      const localCollections: Record<string, SnapshotRow[]> = {};
      for (const collection of collectionNames) {
        localCollections[collection] = (await readCollection(collection)).filter(
          (row): row is SnapshotRow => typeof row.id === 'string',
        );
      }
      const pendingOperations = (await this.getOutbox()).map((operation) => ({
        entityId: operation.entityId,
        status: operation.status,
      }));
      const merged = mergeOfflineSnapshot(
        { revision: snapshot.revision, ...serverCollections },
        localCollections,
        pendingOperations,
      );
      const syncedAt = clock();

      await store.transaction([...collectionNames, 'meta'], async () => {
        for (const collection of collectionNames) {
          const rows = (merged[collection] ?? []) as Record<string, unknown>[];
          const desiredKeys = new Set(rows.flatMap((row) => typeof row.id === 'string' ? [row.id] : []));
          for (const record of await store.getAll(collection)) {
            if (!desiredKeys.has(record.key)) await store.delete(collection, record.key);
          }
          for (const row of rows) {
            if (typeof row.id === 'string') await store.put(collection, { key: row.id, value: row });
          }
        }
        await store.put('meta', { key: 'revision', value: snapshot.revision });
        await store.put('meta', { key: 'lastSyncedAt', value: syncedAt });
      });
    },
    async applyMutation(input) {
      const operationId = idFactory();
      const createdAt = clock();
      const entityStore = operationStores[input.type];
      const entity = input.type.endsWith('.delete')
        ? { id: input.entityId, deleted: true, deletedAt: createdAt }
        : valueWithId(input.entityId, input.payload);
      const operation: OfflineOutboxOperation = {
        operationId,
        deviceId,
        actorId: input.actorId,
        type: input.type,
        entityId: input.entityId,
        payload: input.payload,
        dependencies: [...input.dependencies],
        createdAt,
        status: 'pending',
        attemptCount: 0,
        lastError: null,
      };

      await store.transaction([entityStore, 'outbox'], async () => {
        await store.put(entityStore, { key: input.entityId, value: entity });
        await store.put('outbox', { key: operationId, value: operation });
      });
      return operation;
    },
    async getOutbox() {
      const records = await store.getAll('outbox');
      return records
        .map((record) => record.value as OfflineOutboxOperation)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    },
    async getSyncSummary() {
      const operations = await this.getOutbox();
      return {
        pendingCount: operations.filter((operation) => operation.status !== 'failed').length,
        failedCount: operations.filter((operation) => operation.status === 'failed').length,
      };
    },
  };
}
