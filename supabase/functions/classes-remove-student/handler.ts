import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";

type ClassesRemoveStudentDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  findOwnedClass(classId: string): Promise<{ id: string; teacherId: string } | null>;
  removeMembership(input: { classId: string; studentId: string }): Promise<void>;
};

const defaultDeps: ClassesRemoveStudentDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async findOwnedClass(classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id")
      .eq("id", classId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }

    return { id: data.id as string, teacherId: data.teacher_id as string };
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
      const classId = typeof body?.classId === "string" ? body.classId : "";
      const studentId = typeof body?.studentId === "string" ? body.studentId : "";

      if (!classId || !studentId) {
        return errorResponse("classId and studentId are required", 422);
      }

      const klass = await deps.findOwnedClass(classId);
      if (!klass) {
        return errorResponse("Class not found", 404);
      }
      if (klass.teacherId !== profile.id) {
        return errorResponse("Forbidden", 403);
      }

      await deps.removeMembership({ classId, studentId });
      return jsonResponse({ removed: true });
    } catch (error) {
      console.error("classes-remove-student failed", error);
      return errorResponse("We couldn't remove that student right now.", 500);
    }
  };
}
