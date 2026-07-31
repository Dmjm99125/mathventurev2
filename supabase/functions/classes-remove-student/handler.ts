import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import { getTeacherSingletonClass } from "../_shared/teacher_singleton_class.ts";

type ClassesRemoveStudentDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClassroom(
    teacherId: string,
  ): Promise<{ id: string; teacherId: string; name: string } | null>;
  removeMembership(input: { classId: string; studentId: string }): Promise<void>;
};

const defaultDeps: ClassesRemoveStudentDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getTeacherClassroom(teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at")
      .eq("teacher_id", teacherId);

    if (error) {
      throw error;
    }
    const classrooms = (data ?? []).map((row) => ({
      id: row.id as string,
      teacherId: row.teacher_id as string,
      name: row.name as string,
      createdAt: row.created_at as string,
    }));
    if (!classrooms.length) {
      return null;
    }

    const classroom = await getTeacherSingletonClass(
      { listTeacherClasses: async () => classrooms },
      teacherId,
    );
    return { id: classroom.id, teacherId: classroom.teacherId, name: classroom.name };
  },
  async removeMembership({ classId, studentId }) {
    const { adminClient } = await import("../_shared/client.ts");
    const { error } = await adminClient
      .from("class_students")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", studentId);

    if (error) {
      throw error;
    }
  },
};

export function createClassesRemoveStudentHandler(
  deps: ClassesRemoveStudentDeps = defaultDeps,
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) {
        return errorResponse("Unauthorized", 401);
      }
      if (profile.role !== "teacher") {
        return errorResponse("Only teachers can remove students", 403);
      }

      const body = await req.json().catch(() => null);
      const studentId = typeof body?.studentId === "string" ? body.studentId : "";

      if (!studentId) {
        return errorResponse("studentId is required", 422);
      }

      const classroom = await deps.getTeacherClassroom(profile.id);
      if (!classroom) {
        return errorResponse("Classroom not found", 404);
      }

      await deps.removeMembership({ classId: classroom.id, studentId });
      return jsonResponse({ removed: true });
    } catch (error) {
      console.error("classes-remove-student failed", error);
      return errorResponse("We couldn't remove that student right now.", 500);
    }
  };
}
