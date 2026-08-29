import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";

type AssignmentInsert = {
  lessonId: string;
  name: string;
  classId: string | null;
  studentId: string | null;
  assignedBy: string;
  dueAt: string | null;
};

export type AssignmentsCreateDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  isTeacherForClass(classId: string, teacherId: string): Promise<boolean>;
  insertAssignment(input: AssignmentInsert): Promise<Record<string, unknown>>;
};

const defaultDeps: AssignmentsCreateDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async isTeacherForClass(classId, teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("teacher_id")
      .eq("id", classId)
      .maybeSingle();
    if (error) throw error;
    return data?.teacher_id === teacherId;
  },
  async insertAssignment(input) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("assignments")
      .insert({
        lesson_id: input.lessonId,
        name: input.name,
        class_id: input.classId,
        student_id: input.studentId,
        assigned_by: input.assignedBy,
        due_at: input.dueAt,
      })
      .select("id, name, lesson_id, class_id, student_id, due_at, created_at")
      .single();
    if (error || !data) throw error ?? new Error("Failed to create assignment");
    return data;
  },
};

export function createAssignmentsCreateHandler(deps: AssignmentsCreateDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can create assignments", 403);

      const body = await req.json().catch(() => null);
      const lessonId = typeof body?.lessonId === "string" ? body.lessonId.trim() : "";
      const classId = typeof body?.classId === "string" ? body.classId : null;
      const studentId = typeof body?.studentId === "string" ? body.studentId : null;
      const dueAt = typeof body?.dueAt === "string" ? body.dueAt : null;
      const suppliedName = typeof body?.name === "string" ? body.name.trim() : "";
      const name = suppliedName || lessonId;

      if (!lessonId) return errorResponse("lessonId is required", 422);
      if (!classId && !studentId) return errorResponse("Provide a classId or studentId", 422);
      if (classId && studentId) return errorResponse("Provide only a classId or studentId", 422);
      if (name.length > 120) return errorResponse("Assignment name must be 120 characters or fewer", 422);

      if (classId && !(await deps.isTeacherForClass(classId, profile.id))) {
        return errorResponse("Forbidden", 403);
      }

      const assignment = await deps.insertAssignment({
        lessonId,
        name,
        classId,
        studentId,
        assignedBy: profile.id,
        dueAt,
      });
      return jsonResponse({ assignment }, 201);
    } catch (error) {
      console.error("assignments-create failed", error);
      return errorResponse("We couldn't create that assignment right now.", 500);
    }
  };
}
