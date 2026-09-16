import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";

export type AssignmentsDeleteDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  deleteAssignment(assignmentId: string, teacherId: string): Promise<boolean>;
};

const defaultDeps: AssignmentsDeleteDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async deleteAssignment(assignmentId, teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("assignments")
      .delete()
      .eq("id", assignmentId)
      .eq("assigned_by", teacherId)
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

      const deleted = await deps.deleteAssignment(assignmentId, profile.id);
      if (!deleted) return errorResponse("Assignment not found or forbidden", 404);

      return jsonResponse({ deleted: true });
    } catch (error) {
      console.error("assignments-delete failed", error);
      return errorResponse("We couldn't delete that assignment right now.", 500);
    }
  };
}
