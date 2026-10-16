import type {
  OfflineBootstrapResponse,
  OfflineEntityName,
  OfflineOperationType,
  OfflineOutboxOperation,
} from './types.ts';
import type { OfflineRecord, OfflineStore } from './store.ts';
import { mergeOfflineSnapshot, type SnapshotRow } from './snapshot.ts';
import type { SqliteDatabase, SqliteRow, SqliteTransaction, SqliteValue } from '../sqlite/adapter.ts';

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
  updateOutbox(operationId: string, patch: Partial<OfflineOutboxOperation>): Promise<void>;
  deleteOutbox(operationId: string): Promise<void>;
  listConflicts(): Promise<Record<string, unknown>[]>;
  resolveConflict(key: string, choice: 'local' | 'server'): Promise<void>;
  exportDiagnostics(): Promise<Record<string, unknown>>;
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

function createLegacyOfflineRepository(
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
    async updateOutbox(operationId, patch) {
      const current = await store.get('outbox', operationId);
      if (!current) return;
      await store.put('outbox', {
        key: operationId,
        value: { ...(current.value as OfflineOutboxOperation), ...patch },
      });
    },
    async deleteOutbox(operationId) {
      await store.delete('outbox', operationId);
    },
    async listConflicts() {
      return (await store.getAll('conflicts')).map((record) => record.value as Record<string, unknown>);
    },
    async resolveConflict(key, choice) {
      await store.delete('conflicts', key);
      await store.put('meta', { key: `conflict:${key}`, value: { choice, resolvedAt: clock() } });
    },
    async exportDiagnostics() {
      const operations = await this.getOutbox();
      return {
        exportedAt: clock(),
        syncSummary: await this.getSyncSummary(),
        outbox: operations.map(({ operationId, deviceId, actorId, type, entityId, dependencies, createdAt, status, attemptCount, lastError }) => ({
          operationId,
          deviceId,
          actorId,
          type,
          entityId,
          dependencies,
          createdAt,
          status,
          attemptCount,
          lastError,
        })),
      };
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

const sqliteTables: Record<OfflineEntityName, string> = {
  profiles: 'profiles',
  classrooms: 'classrooms',
  classStudents: 'class_students',
  assignments: 'assignments',
  attempts: 'attempts',
  attemptGameResults: 'attempt_game_results',
  posts: 'posts',
  outbox: 'sync_outbox',
  conflicts: 'sync_conflicts',
  meta: 'app_meta',
};

const sqliteKeys: Record<OfflineEntityName, string> = {
  profiles: 'id',
  classrooms: 'id',
  classStudents: 'student_id',
  assignments: 'id',
  attempts: 'id',
  attemptGameResults: 'id',
  posts: 'id',
  outbox: 'operation_id',
  conflicts: 'conflict_id',
  meta: 'key',
};

function sqliteString(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (typeof row[key] === 'string' && row[key].trim()) return row[key] as string;
  }
  return undefined;
}

function sqliteNumber(row: Record<string, unknown>, fallback: number, ...keys: string[]): number {
  for (const key of keys) {
    if (typeof row[key] === 'number' && Number.isFinite(row[key])) return row[key] as number;
  }
  return fallback;
}

function sqliteJson(value: unknown): string {
  return JSON.stringify(value ?? {}) ?? '{}';
}

function parseSqliteJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function sqliteUpdatedAt(row: Record<string, unknown>, clock: () => string): string {
  return sqliteString(row, 'updated_at', 'updatedAt', 'created_at', 'createdAt') ?? clock();
}

function sqliteDeleted(row: Record<string, unknown>): number {
  const value = row.deleted ?? row.is_deleted ?? row.isDeleted;
  return value === true || value === 1 || value === '1' ? 1 : 0;
}

function sqliteEntityId(collection: OfflineEntityName, row: Record<string, unknown>): string {
  const id = collection === 'classStudents'
    ? sqliteString(row, 'student_id', 'studentId', 'id')
    : collection === 'outbox'
      ? sqliteString(row, 'operation_id', 'operationId', 'id')
      : collection === 'conflicts'
        ? sqliteString(row, 'conflict_id', 'conflictId', 'id')
        : sqliteString(row, 'id');
  if (!id) throw new Error(`SQLite repository row in ${collection} is missing its identifier.`);
  return id;
}

function decodedEntity(collection: OfflineEntityName, row: SqliteRow): Record<string, unknown> {
  if (collection === 'meta') return objectValue(parseSqliteJson(row.value));
  if (collection === 'outbox') {
    return {
      operationId: row.operation_id,
      deviceId: row.device_id,
      actorId: row.actor_id,
      type: row.operation_type,
      entityId: row.entity_id,
      payload: objectValue(parseSqliteJson(row.payload_json)),
      dependencies: Array.isArray(parseSqliteJson(row.dependencies_json)) ? parseSqliteJson(row.dependencies_json) : [],
      baseRevision: row.base_revision ?? 0,
      createdAt: row.created_at,
      status: row.status,
      attemptCount: row.attempt_count ?? 0,
      lastError: row.last_error ?? null,
      nextAttemptAt: row.next_attempt_at ?? null,
    };
  }
  if (collection === 'conflicts') {
    return {
      conflictId: row.conflict_id,
      operationId: row.operation_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      local: parseSqliteJson(row.local_json),
      server: parseSqliteJson(row.server_json),
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at ?? null,
    };
  }
  const value = objectValue(parseSqliteJson(row.data_json));
  for (const [key, entry] of Object.entries(row)) {
    if (key !== 'data_json') value[key] = entry;
  }
  if (collection === 'classStudents' && value.id === undefined) value.id = row.student_id;
  return value;
}

async function writeSqliteEntity(
  tx: SqliteTransaction,
  collection: OfflineEntityName,
  row: Record<string, unknown>,
  clock: () => string,
): Promise<void> {
  const table = sqliteTables[collection];
  const key = sqliteKeys[collection];
  const id = sqliteEntityId(collection, row);
  await tx.execute(`delete from ${table} where ${key} = ?`, [id]);

  if (collection === 'profiles') {
    const role = row.role === 'teacher' ? 'teacher' : 'student';
    await tx.execute(`insert into profiles (id, role, full_name, email, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      role,
      sqliteString(row, 'full_name', 'fullName', 'name') ?? id,
      sqliteString(row, 'email') ?? null,
      sqliteJson(row),
      sqliteNumber(row, 0, 'server_revision', 'serverRevision', 'revision'),
      sqliteDeleted(row),
      sqliteUpdatedAt(row, clock),
    ]);
    return;
  }
  if (collection === 'classrooms') {
    await tx.execute(`insert into classrooms (id, teacher_id, name, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?)`, [
      id,
      sqliteString(row, 'teacher_id', 'teacherId', 'owner_id', 'ownerId') ?? '',
      sqliteString(row, 'name', 'title') ?? id,
      sqliteJson(row),
      sqliteNumber(row, 0, 'server_revision', 'serverRevision', 'revision'),
      sqliteDeleted(row),
      sqliteUpdatedAt(row, clock),
    ]);
    return;
  }
  if (collection === 'classStudents') {
    await tx.execute(`insert into class_students (student_id, class_id, profile_json, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?)`, [
      id,
      sqliteString(row, 'class_id', 'classId') ?? '',
      sqliteJson(row.profile_json ?? row.profile ?? row.profiles ?? {}),
      sqliteJson(row),
      sqliteNumber(row, 0, 'server_revision', 'serverRevision', 'revision'),
      sqliteDeleted(row),
      sqliteUpdatedAt(row, clock),
    ]);
    return;
  }
  if (collection === 'assignments') {
    await tx.execute(`insert into assignments (id, class_id, student_id, lesson_id, name, due_at, assigned_by, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      sqliteString(row, 'class_id', 'classId') ?? null,
      sqliteString(row, 'student_id', 'studentId') ?? null,
      sqliteString(row, 'lesson_id', 'lessonId') ?? '',
      sqliteString(row, 'name', 'title') ?? id,
      sqliteString(row, 'due_at', 'dueAt') ?? null,
      sqliteString(row, 'assigned_by', 'assignedBy') ?? null,
      sqliteJson(row),
      sqliteNumber(row, 0, 'server_revision', 'serverRevision', 'revision'),
      sqliteDeleted(row),
      sqliteUpdatedAt(row, clock),
    ]);
    return;
  }
  if (collection === 'attempts') {
    await tx.execute(`insert into attempts (id, student_id, assignment_id, class_id, lesson_id, status, current_game_order, score, max_score, completed_at, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      sqliteString(row, 'student_id', 'studentId') ?? '',
      sqliteString(row, 'assignment_id', 'assignmentId') ?? null,
      sqliteString(row, 'class_id', 'classId') ?? null,
      sqliteString(row, 'lesson_id', 'lessonId') ?? '',
      sqliteString(row, 'status') ?? 'completed',
      sqliteNumber(row, 0, 'current_game_order', 'currentGameOrder'),
      sqliteNumber(row, 0, 'score'),
      sqliteNumber(row, 0, 'max_score', 'maxScore'),
      sqliteString(row, 'completed_at', 'completedAt') ?? null,
      sqliteJson(row),
      sqliteNumber(row, 0, 'server_revision', 'serverRevision', 'revision'),
      sqliteDeleted(row),
      sqliteUpdatedAt(row, clock),
    ]);
    return;
  }
  if (collection === 'attemptGameResults') {
    await tx.execute(`insert into attempt_game_results (id, attempt_id, student_id, topic_id, game_id, game_order, score, max_score, completed_at, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      sqliteString(row, 'attempt_id', 'attemptId') ?? '',
      sqliteString(row, 'student_id', 'studentId') ?? '',
      sqliteString(row, 'topic_id', 'topicId') ?? '',
      sqliteString(row, 'game_id', 'gameId') ?? '',
      sqliteNumber(row, 0, 'game_order', 'gameOrder'),
      sqliteNumber(row, 0, 'score'),
      sqliteNumber(row, 0, 'max_score', 'maxScore'),
      sqliteString(row, 'completed_at', 'completedAt') ?? null,
      sqliteJson(row),
      sqliteNumber(row, 0, 'server_revision', 'serverRevision', 'revision'),
      sqliteDeleted(row),
      sqliteUpdatedAt(row, clock),
    ]);
    return;
  }
  if (collection === 'posts') {
    await tx.execute(`insert into posts (id, class_id, author_id, content, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      sqliteString(row, 'class_id', 'classId') ?? '',
      sqliteString(row, 'author_id', 'authorId') ?? '',
      sqliteString(row, 'content', 'body') ?? '',
      sqliteJson(row),
      sqliteNumber(row, 0, 'server_revision', 'serverRevision', 'revision'),
      sqliteDeleted(row),
      sqliteUpdatedAt(row, clock),
    ]);
    return;
  }
  if (collection === 'meta') {
    await tx.execute(`insert into app_meta (key, value, updated_at) values (?, ?, ?)`, [id, sqliteJson(row.value), sqliteUpdatedAt(row, clock)]);
    return;
  }
  throw new Error(`SQLite entity writes for ${collection} are handled by a specialized path.`);
}

async function writeSqliteOutbox(tx: SqliteTransaction, operation: OfflineOutboxOperation): Promise<void> {
  const extended = operation as OfflineOutboxOperation & { baseRevision?: number; nextAttemptAt?: string | null };
  await tx.execute('delete from sync_outbox where operation_id = ?', [operation.operationId]);
  await tx.execute(`insert into sync_outbox (operation_id, device_id, actor_id, operation_type, entity_id, payload_json, dependencies_json, base_revision, created_at, status, attempt_count, last_error, next_attempt_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    operation.operationId,
    operation.deviceId,
    operation.actorId,
    operation.type,
    operation.entityId,
    sqliteJson(operation.payload),
    sqliteJson(operation.dependencies),
    extended.baseRevision ?? 0,
    operation.createdAt,
    operation.status,
    operation.attemptCount,
    operation.lastError,
    extended.nextAttemptAt ?? null,
  ]);
}

function decodeOutboxRow(row: SqliteRow): OfflineOutboxOperation {
  return decodedEntity('outbox', row) as unknown as OfflineOutboxOperation;
}

function createSqliteRepository(
  database: SqliteDatabase,
  clock: () => string,
  idFactory: () => string,
  deviceId: string,
): OfflineRepository {
  const readCollection = async (collection: OfflineEntityName): Promise<Record<string, unknown>[]> => {
    const rows = await database.query<SqliteRow>(`select * from ${sqliteTables[collection]}`);
    return rows.map((row) => decodedEntity(collection, row));
  };

  const readByKey = async (collection: OfflineEntityName, key: string): Promise<Record<string, unknown> | undefined> => {
    const rows = await database.query<SqliteRow>(
      `select * from ${sqliteTables[collection]} where ${sqliteKeys[collection]} = ?`,
      [key],
    );
    return rows[0] ? decodedEntity(collection, rows[0]) : undefined;
  };

  const readOutbox = async (): Promise<OfflineOutboxOperation[]> => {
    const rows = await database.query<SqliteRow>('select * from sync_outbox order by created_at');
    return rows.map(decodeOutboxRow);
  };

  return {
    readCollection,
    readByKey,
    async readMeta(key) {
      const rows = await database.query<SqliteRow>('select value from app_meta where key = ?', [key]);
      return rows[0] ? parseSqliteJson(rows[0].value) : undefined;
    },
    async writeMeta(key, value) {
      await database.transaction(async (tx) => {
        await tx.execute('delete from app_meta where key = ?', [key]);
        await tx.execute('insert into app_meta (key, value, updated_at) values (?, ?, ?)', [key, sqliteJson(value), clock()]);
      });
    },
    async putSnapshot(collection, rows) {
      await database.transaction(async (tx) => {
        for (const row of rows) await writeSqliteEntity(tx, collection, row, clock);
      });
    },
    async persistBootstrap(snapshot) {
      const studentRows = rowsWithIds(snapshot.students, (row) => typeof row.student_id === 'string' ? row.student_id : undefined);
      const profileRows = [
        { id: snapshot.teacher.id, role: snapshot.teacher.role, full_name: snapshot.teacher.fullName },
        ...snapshot.students.flatMap((row) => {
          const profile = row.profiles;
          if (!profile || typeof profile !== 'object') return [];
          const value = profile as Record<string, unknown>;
          return typeof value.id === 'string' ? [value] : [];
        }),
      ];
      const serverCollections = {
        profiles: profileRows,
        classrooms: snapshot.classroom ? [snapshot.classroom] : [],
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
      const pendingOperations = (await readOutbox()).map((operation) => ({ entityId: operation.entityId, status: operation.status }));
      const merged = mergeOfflineSnapshot(
        { revision: snapshot.revision, ...serverCollections },
        localCollections,
        pendingOperations,
      );
      const syncedAt = clock();
      await database.transaction(async (tx) => {
        for (const collection of collectionNames) {
          await tx.execute(`delete from ${sqliteTables[collection]}`);
          for (const row of (merged[collection] ?? []) as Record<string, unknown>[]) {
            await writeSqliteEntity(tx, collection, row, clock);
          }
        }
        await tx.execute('delete from app_meta where key = ?', ['revision']);
        await tx.execute('delete from app_meta where key = ?', ['lastSyncedAt']);
        await tx.execute('insert into app_meta (key, value, updated_at) values (?, ?, ?)', ['revision', sqliteJson(snapshot.revision), syncedAt]);
        await tx.execute('insert into app_meta (key, value, updated_at) values (?, ?, ?)', ['lastSyncedAt', sqliteJson(syncedAt), syncedAt]);
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
      await database.transaction(async (tx) => {
        await writeSqliteEntity(tx, entityStore, entity, clock);
        await writeSqliteOutbox(tx, operation);
      });
      return operation;
    },
    getOutbox: readOutbox,
    async updateOutbox(operationId, patch) {
      const current = (await readOutbox()).find((operation) => operation.operationId === operationId);
      if (!current) return;
      await database.transaction((tx) => writeSqliteOutbox(tx, { ...current, ...patch }));
    },
    async deleteOutbox(operationId) {
      await database.execute('delete from sync_outbox where operation_id = ?', [operationId]);
    },
    async listConflicts() {
      return readCollection('conflicts');
    },
    async resolveConflict(key, choice) {
      await database.transaction(async (tx) => {
        await tx.execute('delete from sync_conflicts where conflict_id = ?', [key]);
        await tx.execute('delete from app_meta where key = ?', [`conflict:${key}`]);
        await tx.execute('insert into app_meta (key, value, updated_at) values (?, ?, ?)', [
          `conflict:${key}`,
          sqliteJson({ choice, resolvedAt: clock() }),
          clock(),
        ]);
      });
    },
    async exportDiagnostics() {
      const operations = await readOutbox();
      return {
        exportedAt: clock(),
        syncSummary: await this.getSyncSummary(),
        outbox: operations.map(({ operationId, deviceId, actorId, type, entityId, dependencies, createdAt, status, attemptCount, lastError }) => ({
          operationId, deviceId, actorId, type, entityId, dependencies, createdAt, status, attemptCount, lastError,
        })),
      };
    },
    async getSyncSummary() {
      const operations = await readOutbox();
      return {
        pendingCount: operations.filter((operation) => operation.status !== 'failed').length,
        failedCount: operations.filter((operation) => operation.status === 'failed').length,
      };
    },
  };
}

export function createOfflineRepository(
  storage: OfflineStore | SqliteDatabase,
  clock: () => string = () => new Date().toISOString(),
  idFactory: () => string = () => crypto.randomUUID(),
  deviceId = 'local-device',
): OfflineRepository {
  if ('query' in storage && 'execute' in storage && 'transaction' in storage && 'health' in storage) {
    return createSqliteRepository(storage, clock, idFactory, deviceId);
  }
  return createLegacyOfflineRepository(storage, clock, idFactory, deviceId);
}
