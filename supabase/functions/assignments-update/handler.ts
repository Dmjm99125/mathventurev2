import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";

export type AssignmentUpdateInput = {
  assignmentId: string;
  lessonId: string;
  name: string;
  dueAt: string | null;
};

export type AssignmentsUpdateDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  updateAssignment(
    input: AssignmentUpdateInput & { assignedBy: string },
  ): Promise<Record<string, unknown> | null>;
};

const defaultDeps: AssignmentsUpdateDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async updateAssignment(input) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("assignments")
      .update({ name: input.name, due_at: input.dueAt })
      .eq("id", input.assignmentId)
      .eq("assigned_by", input.assignedBy)
      .select("id, name, lesson_id, class_id, student_id, due_at, created_at")
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

export function createAssignmentsUpdateHandler(
  deps: AssignmentsUpdateDeps = defaultDeps,
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can update assignments", 403);

      const body = await req.json().catch(() => null);
      const assignmentId = typeof body?.assignmentId === "string" ? body.assignmentId.trim() : "";
      const lessonId = typeof body?.lessonId === "string" ? body.lessonId.trim() : "";
      const suppliedName = typeof body?.name === "string" ? body.name.trim() : "";
      const dueAt = body?.dueAt === null || body?.dueAt === undefined || body?.dueAt === ""
        ? null
        : typeof body.dueAt === "string"
          ? body.dueAt
          : undefined;

      if (!assignmentId) return errorResponse("assignmentId is required", 422);
      if (!lessonId) return errorResponse("lessonId is required", 422);
      if (dueAt === undefined) return errorResponse("dueAt must be a date or null", 422);

      const name = suppliedName || lessonId;
      if (name.length > 120) return errorResponse("Assignment name must be 120 characters or fewer", 422);

      const assignment = await deps.updateAssignment({
        assignmentId,
        lessonId,
        name,
        dueAt,
        assignedBy: profile.id,
      });
      if (!assignment) return errorResponse("Assignment not found or forbidden", 404);

      return jsonResponse({ assignment });
    } catch (error) {
      console.error("assignments-update failed", error);
      return errorResponse("We couldn't update that assignment right now.", 500);
    }
  };
}
