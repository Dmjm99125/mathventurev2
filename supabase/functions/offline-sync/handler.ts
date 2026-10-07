import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  applyOfflineOperation,
  MAX_OFFLINE_SYNC_BATCH,
  validateOfflineOperation,
  type OfflineOperation,
  type OfflineOperationExecution,
} from "../_shared/offline_operations.ts";

export type StoredOfflineOperation = {
  status: "applied" | "rejected";
  result?: unknown;
  error?: string | null;
};

export type OfflineSyncDeps = {
  getAuthedProfile: (request: Request) => Promise<AuthedProfile | null>;
  readStoredOperation: (
    deviceId: string,
    operationId: string,
  ) => Promise<StoredOfflineOperation | null>;
  applyOperation: (
    teacherId: string,
    operation: OfflineOperation,
  ) => Promise<OfflineOperationExecution>;
  recordOperation: (
    teacherId: string,
    operation: OfflineOperation,
    execution: Extract<OfflineOperationExecution, { status: "accepted" | "rejected" }>,
  ) => Promise<void>;
};

function defaultDependencies(): OfflineSyncDeps {
  return {
    getAuthedProfile: async (request) => {
      const { getAuthedProfile } = await import("../_shared/client.ts");
      return getAuthedProfile(request);
    },
    readStoredOperation: async (deviceId, operationId) => {
      const { adminClient } = await import("../_shared/client.ts");
      const { data, error } = await adminClient
        .from("offline_sync_operations")
        .select("status, result, error_message")
        .eq("device_id", deviceId)
        .eq("operation_id", operationId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return {
        status: data.status,
        result: data.result,
        error: data.error_message,
      } as StoredOfflineOperation;
    },
    applyOperation: (teacherId, operation) => applyOfflineOperation(teacherId, operation),
    recordOperation: async (teacherId, operation, execution) => {
      const { adminClient } = await import("../_shared/client.ts");
      const { error } = await adminClient.from("offline_sync_operations").insert({
        teacher_id: teacherId,
        device_id: operation.deviceId,
        operation_id: operation.operationId,
        actor_id: operation.actorId,
        operation_type: operation.type,
        entity_id: operation.entityId,
        payload: operation.payload,
        result: execution.result ?? null,
        status: execution.status === "accepted" ? "applied" : "rejected",
        error_message: execution.error ?? null,
      });
      if (error) throw new Error(error.message);
    },
  };
}

function resultForInvalidOperation(value: unknown, error: string) {
  const operationId = value && typeof value === "object" && "operationId" in value
    ? (value as { operationId?: unknown }).operationId
    : null;
  return {
    operationId: typeof operationId === "string" ? operationId : null,
    status: "rejected",
    error,
  };
}

export function createOfflineSyncHandler(
  dependencies: OfflineSyncDeps = defaultDependencies(),
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (request.method !== "POST") return errorResponse("Method not allowed", 405);

    const profile = await dependencies.getAuthedProfile(request);
    if (!profile) return errorResponse("Unauthorized", 401);
    if (profile.role !== "teacher") return errorResponse("Only teachers can sync classroom data", 403);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Sync body must be an object", 400);
    }
    const input = body as { deviceId?: unknown; operations?: unknown };
    if (typeof input.deviceId !== "string" || input.deviceId.length === 0) {
      return errorResponse("deviceId is required", 400);
    }
    if (!Array.isArray(input.operations)) return errorResponse("operations must be an array", 400);
    if (input.operations.length > MAX_OFFLINE_SYNC_BATCH) {
      return errorResponse(`A sync batch may contain at most ${MAX_OFFLINE_SYNC_BATCH} operations`, 400);
    }

    const results: Array<Record<string, unknown>> = [];
    for (const value of input.operations) {
      const validation = validateOfflineOperation(value, input.deviceId, profile.id);
      if (!validation.valid) {
        results.push(resultForInvalidOperation(value, validation.error));
        continue;
      }
      const operation = validation.operation;
      try {
        const stored = await dependencies.readStoredOperation(operation.deviceId, operation.operationId);
        if (stored) {
          results.push({
            operationId: operation.operationId,
            status: "duplicate",
            result: stored.result ?? null,
            error: stored.error ?? undefined,
          });
          continue;
        }
        const execution = await dependencies.applyOperation(profile.id, operation);
        if (execution.status === "retryable") {
          results.push({
            operationId: operation.operationId,
            status: "retryable",
            error: execution.error ?? "The operation can be retried.",
          });
          continue;
        }
        await dependencies.recordOperation(profile.id, operation, execution);
        results.push({
          operationId: operation.operationId,
          status: execution.status === "accepted" ? "accepted" : "rejected",
          result: execution.result ?? null,
          error: execution.error ?? undefined,
        });
      } catch (error) {
        console.error("offline-sync operation failed", error);
        results.push({
          operationId: operation.operationId,
          status: "retryable",
          error: "The operation could not be synchronized yet.",
        });
      }
    }
    return jsonResponse({ results });
  };
}
