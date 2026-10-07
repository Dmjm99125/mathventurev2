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

export type AssignmentOperationInput = {
  id: string;
  lessonId: string;
  name: string;
  classId: string | null;
  studentId: string | null;
  assignedBy: string;
  dueAt: string | null;
};

export type AssignmentOperationPersistence = {
  isTeacherForClass(classId: string, teacherId: string): Promise<boolean>;
  lessonExists(lessonId: string): Promise<boolean>;
  insertAssignment(input: AssignmentOperationInput): Promise<Record<string, unknown>>;
  readAssignment(assignmentId: string): Promise<Record<string, unknown> | null>;
  updateAssignment(
    assignmentId: string,
    input: { name: string; dueAt: string | null },
  ): Promise<Record<string, unknown> | null>;
  deleteAssignment(assignmentId: string): Promise<boolean>;
};

function payloadString(payload: Record<string, unknown>, key: string): string {
  return typeof payload[key] === "string" ? String(payload[key]).trim() : "";
}

function payloadNullableString(payload: Record<string, unknown>, key: string): string | null {
  if (payload[key] === null || payload[key] === undefined || payload[key] === "") return null;
  return typeof payload[key] === "string" ? payload[key] as string : null;
}

async function teacherOwnsAssignment(
  persistence: AssignmentOperationPersistence,
  assignment: Record<string, unknown>,
  teacherId: string,
): Promise<boolean> {
  if (assignment.assigned_by === teacherId) return true;
  return typeof assignment.class_id === "string"
    && await persistence.isTeacherForClass(assignment.class_id, teacherId);
}

export function createAssignmentOperationApplier(
  persistence: AssignmentOperationPersistence,
): (teacherId: string, operation: OfflineOperation) => Promise<OfflineOperationExecution> {
  return async (teacherId, operation) => {
    const payload = operation.payload;
    if (operation.type === "assignment.create") {
      const lessonId = payloadString(payload, "lessonId");
      const classId = payloadString(payload, "classId") || null;
      const studentId = payloadString(payload, "studentId") || null;
      const name = payloadString(payload, "name") || lessonId;
      const dueAt = payloadNullableString(payload, "dueAt");
      if (!lessonId) return { status: "rejected", error: "lessonId is required." };
      if ((classId ? 1 : 0) + (studentId ? 1 : 0) !== 1) {
        return { status: "rejected", error: "Provide exactly one assignment target." };
      }
      if (!await persistence.lessonExists(lessonId)) {
        return { status: "rejected", error: "The lesson does not exist." };
      }
      if (classId && !await persistence.isTeacherForClass(classId, teacherId)) {
        return { status: "rejected", error: "The teacher does not own the target class." };
      }
      if (name.length > 120) return { status: "rejected", error: "Assignment name is too long." };
      const assignment = await persistence.insertAssignment({
        id: operation.entityId,
        lessonId,
        name,
        classId,
        studentId,
        assignedBy: teacherId,
        dueAt,
      });
      return { status: "accepted", result: { assignment } };
    }

    const assignmentId = operation.entityId;
    const existing = await persistence.readAssignment(assignmentId);
    if (!existing || !await teacherOwnsAssignment(persistence, existing, teacherId)) {
      return { status: "rejected", error: "Assignment not found or forbidden." };
    }
    if (operation.type === "assignment.update") {
      const expectedCreatedAt = payload.createdAt;
      if (typeof expectedCreatedAt === "string" && expectedCreatedAt !== existing.created_at) {
        return {
          status: "rejected",
          error: "Assignment changed on the server.",
          result: { conflict: true, server: existing },
        };
      }
      const name = payloadString(payload, "name") || String(existing.name ?? existing.lesson_id ?? "Assignment");
      const dueAt = payloadNullableString(payload, "dueAt");
      const assignment = await persistence.updateAssignment(assignmentId, { name, dueAt });
      return assignment
        ? { status: "accepted", result: { assignment } }
        : { status: "rejected", error: "Assignment not found or forbidden." };
    }
    if (operation.type === "assignment.delete") {
      const deleted = await persistence.deleteAssignment(assignmentId);
      return deleted
        ? { status: "accepted", result: { deleted: true, id: assignmentId } }
        : { status: "rejected", error: "Assignment not found or forbidden." };
    }
    return { status: "retryable", error: "Operation is not an assignment mutation." };
  };
}

export async function applyOfflineOperation(
  teacherId: string,
  operation: OfflineOperation,
): Promise<OfflineOperationExecution> {
  if (operation.type === "assignment.create" || operation.type === "assignment.update" || operation.type === "assignment.delete") {
    const { adminClient } = await import("./client.ts");
    const persistence: AssignmentOperationPersistence = {
      async isTeacherForClass(classId, ownerId) {
        const { data, error } = await adminClient
          .from("classes")
          .select("id")
          .eq("id", classId)
          .eq("teacher_id", ownerId)
          .maybeSingle();
        if (error) throw error;
        return Boolean(data);
      },
      async lessonExists(lessonId) {
        const { data, error } = await adminClient.from("lessons").select("id").eq("id", lessonId).maybeSingle();
        if (error) throw error;
        return Boolean(data);
      },
      async insertAssignment(input) {
        const { data, error } = await adminClient.from("assignments").insert({
          id: input.id,
          lesson_id: input.lessonId,
          name: input.name,
          class_id: input.classId,
          student_id: input.studentId,
          assigned_by: input.assignedBy,
          due_at: input.dueAt,
        }).select("id, name, lesson_id, class_id, student_id, assigned_by, due_at, created_at").single();
        if (error || !data) throw error ?? new Error("Failed to create assignment");
        return data;
      },
      async readAssignment(assignmentId) {
        const { data, error } = await adminClient.from("assignments")
          .select("id, name, lesson_id, class_id, student_id, assigned_by, due_at, created_at")
          .eq("id", assignmentId).maybeSingle();
        if (error) throw error;
        return data;
      },
      async updateAssignment(assignmentId, input) {
        const { data, error } = await adminClient.from("assignments")
          .update({ name: input.name, due_at: input.dueAt })
          .eq("id", assignmentId)
          .select("id, name, lesson_id, class_id, student_id, assigned_by, due_at, created_at")
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async deleteAssignment(assignmentId) {
        const { data, error } = await adminClient.from("assignments")
          .delete().eq("id", assignmentId).select("id");
        if (error) throw error;
        return Boolean(data?.length);
      },
    };
    return createAssignmentOperationApplier(persistence)(teacherId, operation);
  }
  return {
    status: "retryable",
    error: `Operation ${operation.type} is not available on this server yet.`,
  };
}
