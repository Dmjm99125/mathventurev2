import type { SqliteDatabase, SqliteTransaction, SqliteValue } from './adapter.ts';
import {
  LEGACY_CLASSROOM_STORE_NAMES,
  type LegacyClassroomSource,
  type OfflineRecord,
} from '../classroom/store.ts';
import type { OfflineEntityName } from '../classroom/types.ts';

export const LEGACY_MIGRATION_KEY = 'legacy-idb-migrated';

type LegacyRow = Record<string, unknown>;

function asObject(record: OfflineRecord, storeName: OfflineEntityName): LegacyRow {
  if (!record.value || typeof record.value !== 'object' || Array.isArray(record.value)) {
    throw new Error(`Legacy ${storeName} record ${record.key} is not an object.`);
  }
  return record.value as LegacyRow;
}

function text(row: LegacyRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (typeof row[key] === 'string' && row[key].trim()) return row[key] as string;
  }
  return undefined;
}

function requiredText(row: LegacyRow, context: string, ...keys: string[]): string {
  const value = text(row, ...keys);
  if (!value) throw new Error(`Legacy ${context} is missing ${keys[0]}.`);
  return value;
}

function nullableText(row: LegacyRow, ...keys: string[]): string | null {
  return text(row, ...keys) ?? null;
}

function numberValue(row: LegacyRow, fallback: number, ...keys: string[]): number {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function integerValue(row: LegacyRow, fallback: number, ...keys: string[]): number {
  return Math.trunc(numberValue(row, fallback, ...keys));
}

function deletedValue(row: LegacyRow): number {
  const value = row.is_deleted ?? row.isDeleted ?? row.deleted;
  return value === true || value === 1 || value === '1' ? 1 : 0;
}

function json(value: unknown): string {
  return JSON.stringify(value ?? {}) ?? '{}';
}

function dataJson(row: LegacyRow): string {
  return json(row);
}

function updatedAt(row: LegacyRow, clock: () => string): string {
  return text(row, 'updated_at', 'updatedAt', 'created_at', 'createdAt') ?? clock();
}

function rowId(record: OfflineRecord, row: LegacyRow, ...keys: string[]): string {
  return text(row, ...keys) ?? record.key;
}

function profileJson(row: LegacyRow): string {
  return json(row.profile_json ?? row.profile ?? row.profiles ?? {});
}

function statusValue(row: LegacyRow): 'pending' | 'syncing' | 'failed' {
  const status = text(row, 'status') ?? 'pending';
  if (status === 'pending' || status === 'syncing' || status === 'failed') return status;
  throw new Error(`Legacy outbox operation has unsupported status ${status}.`);
}

async function insert(tx: SqliteTransaction, sql: string, params: readonly SqliteValue[]): Promise<void> {
  await tx.execute(sql, params);
}

async function importProfiles(tx: SqliteTransaction, records: readonly OfflineRecord[], clock: () => string): Promise<void> {
  for (const record of records) {
    const row = asObject(record, 'profiles');
    const id = rowId(record, row, 'id', 'profile_id', 'profileId');
    const role = text(row, 'role');
    if (role !== 'teacher' && role !== 'student') throw new Error(`Legacy profile ${id} has an unsupported role.`);
    await insert(tx, `insert into profiles (id, role, full_name, email, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      role,
      requiredText(row, `profile ${id}`, 'full_name', 'fullName', 'name'),
      nullableText(row, 'email'),
      dataJson(row),
      integerValue(row, 0, 'server_revision', 'serverRevision', 'revision'),
      deletedValue(row),
      updatedAt(row, clock),
    ]);
  }
}

async function importClassrooms(tx: SqliteTransaction, records: readonly OfflineRecord[], clock: () => string): Promise<void> {
  for (const record of records) {
    const row = asObject(record, 'classrooms');
    const id = rowId(record, row, 'id', 'class_id', 'classId');
    await insert(tx, `insert into classrooms (id, teacher_id, name, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?)`, [
      id,
      requiredText(row, `classroom ${id}`, 'teacher_id', 'teacherId', 'owner_id', 'ownerId'),
      requiredText(row, `classroom ${id}`, 'name', 'title'),
      dataJson(row),
      integerValue(row, 0, 'server_revision', 'serverRevision', 'revision'),
      deletedValue(row),
      updatedAt(row, clock),
    ]);
  }
}

async function importClassStudents(tx: SqliteTransaction, records: readonly OfflineRecord[], clock: () => string): Promise<void> {
  for (const record of records) {
    const row = asObject(record, 'classStudents');
    const studentId = rowId(record, row, 'student_id', 'studentId', 'id');
    await insert(tx, `insert into class_students (student_id, class_id, profile_json, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?)`, [
      studentId,
      requiredText(row, `class student ${studentId}`, 'class_id', 'classId'),
      profileJson(row),
      dataJson(row),
      integerValue(row, 0, 'server_revision', 'serverRevision', 'revision'),
      deletedValue(row),
      updatedAt(row, clock),
    ]);
  }
}

async function importAssignments(tx: SqliteTransaction, records: readonly OfflineRecord[], clock: () => string): Promise<void> {
  for (const record of records) {
    const row = asObject(record, 'assignments');
    const id = rowId(record, row, 'id', 'assignment_id', 'assignmentId');
    await insert(tx, `insert into assignments (id, class_id, student_id, lesson_id, name, due_at, assigned_by, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      nullableText(row, 'class_id', 'classId'),
      nullableText(row, 'student_id', 'studentId'),
      requiredText(row, `assignment ${id}`, 'lesson_id', 'lessonId'),
      requiredText(row, `assignment ${id}`, 'name', 'title'),
      nullableText(row, 'due_at', 'dueAt'),
      nullableText(row, 'assigned_by', 'assignedBy'),
      dataJson(row),
      integerValue(row, 0, 'server_revision', 'serverRevision', 'revision'),
      deletedValue(row),
      updatedAt(row, clock),
    ]);
  }
}

async function importAttempts(tx: SqliteTransaction, records: readonly OfflineRecord[], clock: () => string): Promise<void> {
  for (const record of records) {
    const row = asObject(record, 'attempts');
    const id = rowId(record, row, 'id', 'attempt_id', 'attemptId');
    await insert(tx, `insert into attempts (id, student_id, assignment_id, class_id, lesson_id, status, current_game_order, score, max_score, completed_at, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      requiredText(row, `attempt ${id}`, 'student_id', 'studentId'),
      nullableText(row, 'assignment_id', 'assignmentId'),
      nullableText(row, 'class_id', 'classId'),
      requiredText(row, `attempt ${id}`, 'lesson_id', 'lessonId'),
      text(row, 'status') ?? 'completed',
      integerValue(row, 0, 'current_game_order', 'currentGameOrder'),
      numberValue(row, 0, 'score'),
      numberValue(row, 0, 'max_score', 'maxScore'),
      nullableText(row, 'completed_at', 'completedAt'),
      dataJson(row),
      integerValue(row, 0, 'server_revision', 'serverRevision', 'revision'),
      deletedValue(row),
      updatedAt(row, clock),
    ]);
  }
}

async function importGameResults(tx: SqliteTransaction, records: readonly OfflineRecord[], clock: () => string): Promise<void> {
  for (const record of records) {
    const row = asObject(record, 'attemptGameResults');
    const id = rowId(record, row, 'id', 'result_id', 'resultId');
    await insert(tx, `insert into attempt_game_results (id, attempt_id, student_id, topic_id, game_id, game_order, score, max_score, completed_at, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      requiredText(row, `game result ${id}`, 'attempt_id', 'attemptId'),
      requiredText(row, `game result ${id}`, 'student_id', 'studentId'),
      requiredText(row, `game result ${id}`, 'topic_id', 'topicId'),
      requiredText(row, `game result ${id}`, 'game_id', 'gameId'),
      integerValue(row, 0, 'game_order', 'gameOrder'),
      numberValue(row, 0, 'score'),
      numberValue(row, 0, 'max_score', 'maxScore'),
      nullableText(row, 'completed_at', 'completedAt'),
      dataJson(row),
      integerValue(row, 0, 'server_revision', 'serverRevision', 'revision'),
      deletedValue(row),
      updatedAt(row, clock),
    ]);
  }
}

async function importPosts(tx: SqliteTransaction, records: readonly OfflineRecord[], clock: () => string): Promise<void> {
  for (const record of records) {
    const row = asObject(record, 'posts');
    const id = rowId(record, row, 'id', 'post_id', 'postId');
    await insert(tx, `insert into posts (id, class_id, author_id, content, data_json, server_revision, is_deleted, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`, [
      id,
      requiredText(row, `post ${id}`, 'class_id', 'classId'),
      requiredText(row, `post ${id}`, 'author_id', 'authorId'),
      requiredText(row, `post ${id}`, 'content', 'body'),
      dataJson(row),
      integerValue(row, 0, 'server_revision', 'serverRevision', 'revision'),
      deletedValue(row),
      updatedAt(row, clock),
    ]);
  }
}

async function importOutbox(tx: SqliteTransaction, records: readonly OfflineRecord[]): Promise<void> {
  for (const record of records) {
    const row = asObject(record, 'outbox');
    const operationId = rowId(record, row, 'operationId', 'operation_id', 'id');
    await insert(tx, `insert into sync_outbox (operation_id, device_id, actor_id, operation_type, entity_id, payload_json, dependencies_json, base_revision, created_at, status, attempt_count, last_error, next_attempt_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      operationId,
      requiredText(row, `outbox operation ${operationId}`, 'deviceId', 'device_id'),
      requiredText(row, `outbox operation ${operationId}`, 'actorId', 'actor_id'),
      requiredText(row, `outbox operation ${operationId}`, 'type', 'operationType', 'operation_type'),
      requiredText(row, `outbox operation ${operationId}`, 'entityId', 'entity_id'),
      json(row.payload),
      json(Array.isArray(row.dependencies) ? row.dependencies : []),
      integerValue(row, 0, 'baseRevision', 'base_revision'),
      requiredText(row, `outbox operation ${operationId}`, 'createdAt', 'created_at'),
      statusValue(row),
      integerValue(row, 0, 'attemptCount', 'attempt_count'),
      nullableText(row, 'lastError', 'last_error'),
      nullableText(row, 'nextAttemptAt', 'next_attempt_at'),
    ]);
  }
}

async function importConflicts(tx: SqliteTransaction, records: readonly OfflineRecord[], clock: () => string): Promise<void> {
  for (const record of records) {
    const row = asObject(record, 'conflicts');
    const conflictId = rowId(record, row, 'conflictId', 'conflict_id', 'id');
    await insert(tx, `insert into sync_conflicts (conflict_id, operation_id, entity_type, entity_id, local_json, server_json, message, status, created_at, resolved_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      conflictId,
      requiredText(row, `conflict ${conflictId}`, 'operationId', 'operation_id'),
      text(row, 'entityType', 'entity_type') ?? 'unknown',
      requiredText(row, `conflict ${conflictId}`, 'entityId', 'entity_id'),
      json(row.local ?? row.local_json),
      json(row.server ?? row.server_json),
      text(row, 'message') ?? 'Imported offline conflict',
      text(row, 'status') === 'resolved' ? 'resolved' : 'open',
      text(row, 'createdAt', 'created_at') ?? clock(),
      nullableText(row, 'resolvedAt', 'resolved_at'),
    ]);
  }
}

async function importMeta(tx: SqliteTransaction, records: readonly OfflineRecord[], clock: () => string): Promise<void> {
  for (const record of records) {
    const row = record.value;
    await insert(tx, `insert into app_meta (key, value, updated_at) values (?, ?, ?)`, [
      record.key,
      json(row),
      updatedAt(row && typeof row === 'object' && !Array.isArray(row) ? row as LegacyRow : {}, clock),
    ]);
  }
}

export async function importLegacyClassroomDatabase(
  target: SqliteDatabase,
  source: LegacyClassroomSource,
  clock: () => string = () => new Date().toISOString(),
): Promise<void> {
  const marker = await target.query<{ value: string }>('select value from app_meta where key = ?', [LEGACY_MIGRATION_KEY]);
  if (marker.length > 0) return;

  const records = Object.fromEntries(
    await Promise.all(LEGACY_CLASSROOM_STORE_NAMES.map(async (storeName) => [storeName, await source.getAll(storeName)] as const)),
  ) as Record<OfflineEntityName, OfflineRecord[]>;

  await target.transaction(async (tx) => {
    await importProfiles(tx, records.profiles, clock);
    await importClassrooms(tx, records.classrooms, clock);
    await importClassStudents(tx, records.classStudents, clock);
    await importAssignments(tx, records.assignments, clock);
    await importAttempts(tx, records.attempts, clock);
    await importGameResults(tx, records.attemptGameResults, clock);
    await importPosts(tx, records.posts, clock);
    await importOutbox(tx, records.outbox);
    await importConflicts(tx, records.conflicts, clock);
    await importMeta(tx, records.meta, clock);
    await insert(tx, `insert into app_meta (key, value, updated_at) values (?, ?, ?)`, [
      LEGACY_MIGRATION_KEY,
      json({ importedAt: clock(), source: 'mathventure-classroom' }),
      clock(),
    ]);
  });
}
