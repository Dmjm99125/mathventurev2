import type {
  OfflineEntityName,
  OfflineOperationType,
  OfflineOutboxOperation,
} from './types.ts';
import type { OfflineRecord, OfflineStore } from './store.ts';

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
  applyMutation(input: OfflineMutationInput): Promise<OfflineOutboxOperation>;
  getOutbox(): Promise<OfflineOutboxOperation[]>;
  getSyncSummary(): Promise<{ pendingCount: number; failedCount: number }>;
};

function valueWithId(entityId: string, payload: Record<string, unknown>): Record<string, unknown> {
  return { id: entityId, ...payload };
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
