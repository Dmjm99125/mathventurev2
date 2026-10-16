import type { OfflineOutboxOperation } from './types.ts';

export type EntityIdMapping = {
  entityType: string;
  localId: string;
  serverId: string;
};

export type RemapEntityIdInput = EntityIdMapping & {
  rows: Record<string, unknown>[];
  operations: OfflineOutboxOperation[];
};

export type RemapEntityIdResult = {
  mapping: EntityIdMapping;
  rows: Record<string, unknown>[];
  operations: OfflineOutboxOperation[];
};

const idBearingFields = new Set([
  'id',
  'entityId',
  'entity_id',
  'localId',
  'local_id',
  'serverId',
  'server_id',
  'studentId',
  'student_id',
  'studentIds',
  'student_ids',
  'classId',
  'class_id',
  'assignmentId',
  'assignment_id',
  'attemptId',
  'attempt_id',
  'postId',
  'post_id',
  'profileId',
  'profile_id',
  'classroomId',
  'classroom_id',
]);

function rewriteKnownIds(value: unknown, field: string | undefined, localId: string, serverId: string): unknown {
  if (typeof value === 'string') {
    return field && idBearingFields.has(field) && value === localId ? serverId : value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => rewriteKnownIds(entry, field, localId, serverId));
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, rewriteKnownIds(entry, key, localId, serverId)]),
  );
}

export function remapEntityId(input: RemapEntityIdInput): RemapEntityIdResult {
  if (!input.localId || !input.serverId || input.localId === input.serverId) {
    throw new Error('A provisional ID remap requires two distinct non-empty IDs.');
  }
  return {
    mapping: {
      entityType: input.entityType,
      localId: input.localId,
      serverId: input.serverId,
    },
    rows: input.rows.map((row) => rewriteKnownIds(row, undefined, input.localId, input.serverId) as Record<string, unknown>),
    operations: input.operations.map((operation) => ({
      ...operation,
      entityId: operation.entityId === input.localId ? input.serverId : operation.entityId,
      payload: rewriteKnownIds(operation.payload, undefined, input.localId, input.serverId) as Record<string, unknown>,
    })),
  };
}
