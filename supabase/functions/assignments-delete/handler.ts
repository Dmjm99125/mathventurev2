import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import { canTeacherManageAssignment } from "../_shared/assignment-access.ts";

export type AssignmentsDeleteDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  canManageAssignment?(assignmentId: string, teacherId: string): Promise<boolean>;
  deleteAssignment(assignmentId: string, teacherId: string): Promise<boolean>;
};

const defaultDeps: AssignmentsDeleteDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async canManageAssignment(assignmentId, teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data: assignment, error: assignmentError } = await adminClient
      .from("assignments")
      .select("assigned_by, class_id")
      .eq("id", assignmentId)
      .maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment) return false;

    const { data: teacherClasses, error: classesError } = await adminClient
      .from("classes")
      .select("id")
      .eq("teacher_id", teacherId);
    if (classesError) throw classesError;

    return canTeacherManageAssignment(
      { assignedBy: assignment.assigned_by, classId: assignment.class_id ?? null },
      teacherId,
      (teacherClasses ?? []).map((row: { id: string }) => row.id),
    );
  },
  async deleteAssignment(assignmentId, teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("assignments")
      .delete()
      .eq("id", assignmentId)
      .select("id");
    if (error) throw error;
    return (data ?? []).length > 0;
  },
};

export function createAssignmentsDeleteHandler(
  deps: AssignmentsDeleteDeps = defaultDeps,
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can delete assignments", 403);

      const body = await req.json().catch(() => null);
      const assignmentId = typeof body?.assignmentId === "string" ? body.assignmentId.trim() : "";
      if (!assignmentId) return errorResponse("assignmentId is required", 422);

      if (deps.canManageAssignment && !(await deps.canManageAssignment(assignmentId, profile.id))) {
        return errorResponse("Assignment not found or forbidden", 404);
      }

      const deleted = await deps.deleteAssignment(assignmentId, profile.id);
      if (!deleted) return errorResponse("Assignment not found or forbidden", 404);

      return jsonResponse({ deleted: true });
    } catch (error) {
      console.error("assignments-delete failed", error);
      return errorResponse("We couldn't delete that assignment right now.", 500);
    }
  };
}
