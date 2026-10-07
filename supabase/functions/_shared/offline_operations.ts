export const MAX_OFFLINE_SYNC_BATCH = 50;

export const OFFLINE_OPERATION_TYPES = [
  "class.ensure",
  "class.addStudents",
  "class.removeStudent",
  "assignment.create",
  "assignment.update",
  "assignment.delete",
  "assignmentQuiz.start",
  "assignmentQuiz.checkpoint",
  "assignmentQuiz.complete",
  "attempt.submit",
  "post.create",
] as const;

export type OfflineOperationType = (typeof OFFLINE_OPERATION_TYPES)[number];

export type OfflineOperation = {
  operationId: string;
  deviceId: string;
  actorId: string;
  type: OfflineOperationType;
  entityId: string;
  payload: Record<string, unknown>;
  dependencies: string[];
  createdAt: string;
};

export type OfflineOperationValidation =
  | { valid: true; operation: OfflineOperation }
  | { valid: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validateOfflineOperation(
  value: unknown,
  expectedDeviceId: string,
  expectedActorId: string,
): OfflineOperationValidation {
  if (!isRecord(value)) return { valid: false, error: "Operation must be an object." };
  const operation = value as Partial<OfflineOperation>;
  if (typeof operation.operationId !== "string" || operation.operationId.length === 0) {
    return { valid: false, error: "Operation ID is required." };
  }
  if (operation.deviceId !== expectedDeviceId) {
    return { valid: false, error: "Operation device does not match the sync device." };
  }
  if (operation.actorId !== expectedActorId) {
    return { valid: false, error: "Operation actor does not match the signed-in teacher." };
  }
  if (!OFFLINE_OPERATION_TYPES.includes(operation.type as OfflineOperationType)) {
    return { valid: false, error: "Operation type is not supported." };
  }
  if (typeof operation.entityId !== "string" || operation.entityId.length === 0) {
    return { valid: false, error: "Operation entity ID is required." };
  }
  if (!isRecord(operation.payload)) return { valid: false, error: "Operation payload must be an object." };
  if (!Array.isArray(operation.dependencies) || operation.dependencies.some((id) => typeof id !== "string")) {
    return { valid: false, error: "Operation dependencies must be string IDs." };
  }
  if (typeof operation.createdAt !== "string" || Number.isNaN(Date.parse(operation.createdAt))) {
    return { valid: false, error: "Operation createdAt must be an ISO date." };
  }
  return { valid: true, operation: operation as OfflineOperation };
}

export type OfflineOperationExecution =
  | {
    status: "accepted";
    result?: unknown;
    error?: string;
  }
  | {
    status: "rejected";
    result?: unknown;
    error?: string;
  }
  | {
    status: "retryable";
    result?: unknown;
    error?: string;
  };

export async function applyOfflineOperation(
  _teacherId: string,
  operation: OfflineOperation,
): Promise<OfflineOperationExecution> {
  return {
    status: "retryable",
    error: `Operation ${operation.type} is not available on this server yet.`,
  };
}
