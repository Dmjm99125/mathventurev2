export type OfflineSyncStatus = 'online' | 'offline' | 'syncing' | 'needs-auth' | 'error';

export type OfflineEntityName =
  | 'profiles'
  | 'classrooms'
  | 'classStudents'
  | 'assignments'
  | 'attempts'
  | 'attemptGameResults'
  | 'posts'
  | 'outbox'
  | 'conflicts'
  | 'meta';

export type OfflineOperationType =
  | 'class.ensure'
  | 'class.addStudents'
  | 'class.removeStudent'
  | 'assignment.create'
  | 'assignment.update'
  | 'assignment.delete'
  | 'assignmentQuiz.start'
  | 'assignmentQuiz.checkpoint'
  | 'assignmentQuiz.complete'
  | 'attempt.submit'
  | 'post.create';

export type OfflineOutboxOperation = {
  operationId: string;
  deviceId: string;
  actorId: string;
  type: OfflineOperationType;
  entityId: string;
  payload: Record<string, unknown>;
  dependencies: string[];
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  attemptCount: number;
  lastError: string | null;
};

export type OfflineBootstrapResponse = {
  revision: number;
  teacher: { id: string; role: 'teacher'; fullName: string };
  classroom: Record<string, unknown> | null;
  students: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
  attempts: Record<string, unknown>[];
  gameResults: Record<string, unknown>[];
  posts: Record<string, unknown>[];
};

export function isOfflineSyncStatus(value: unknown): value is OfflineSyncStatus {
  return value === 'online'
    || value === 'offline'
    || value === 'syncing'
    || value === 'needs-auth'
    || value === 'error';
}

export function isOfflineOutboxOperation(value: unknown): value is OfflineOutboxOperation {
  if (!value || typeof value !== 'object') return false;
  const operation = value as Partial<OfflineOutboxOperation>;
  return typeof operation.operationId === 'string'
    && typeof operation.deviceId === 'string'
    && typeof operation.actorId === 'string'
    && typeof operation.entityId === 'string'
    && Array.isArray(operation.dependencies)
    && typeof operation.payload === 'object'
    && operation.payload !== null;
}

export function isOfflineBootstrapResponse(value: unknown): value is OfflineBootstrapResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<OfflineBootstrapResponse>;
  return Number.isInteger(response.revision)
    && typeof response.teacher === 'object'
    && response.teacher !== null
    && Array.isArray(response.students)
    && Array.isArray(response.assignments)
    && Array.isArray(response.attempts)
    && Array.isArray(response.gameResults)
    && Array.isArray(response.posts);
}
