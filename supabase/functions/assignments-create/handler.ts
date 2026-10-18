import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import {
  assertWritableTeacherClass,
  type TeacherOwnedClass,
} from "../_shared/teacher_class_access.ts";

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
  getTeacherClass?(teacherId: string, classId: string): Promise<TeacherOwnedClass | null>;
  isTeacherForClass?(classId: string, teacherId: string): Promise<boolean>;
  insertAssignment(input: AssignmentInsert): Promise<Record<string, unknown>>;
};

const defaultDeps: AssignmentsCreateDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getTeacherClass(teacherId, classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at, archived_at")
      .eq("id", classId)
      .eq("teacher_id", teacherId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id as string,
      teacherId: data.teacher_id as string,
      name: data.name as string,
      createdAt: data.created_at as string,
      archivedAt: (data.archived_at as string | null) ?? null,
    };
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

      if (classId) {
        const classroom = deps.getTeacherClass
          ? await deps.getTeacherClass(profile.id, classId)
          : null;
        if (deps.getTeacherClass && !classroom) {
          return errorResponse("Forbidden", 403);
        }
        if (classroom) {
          try {
            assertWritableTeacherClass(classroom);
          } catch (error) {
            if (error instanceof Error && error.message === "This classroom is archived and read-only.") {
              return errorResponse("Archived classrooms are read-only", 409);
            }
            throw error;
          }
        } else if (deps.isTeacherForClass && !(await deps.isTeacherForClass(classId, profile.id))) {
          return errorResponse("Forbidden", 403);
        } else if (!deps.getTeacherClass && !deps.isTeacherForClass) {
          return errorResponse("Forbidden", 403);
        }
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
