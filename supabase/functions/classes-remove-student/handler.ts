import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import {
  assertWritableTeacherClass,
  type TeacherOwnedClass,
} from "../_shared/teacher_class_access.ts";

type ClassesRemoveStudentDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClass(
    teacherId: string,
    classId: string,
  ): Promise<TeacherOwnedClass | null>;
  removeMembership(input: { classId: string; studentId: string }): Promise<void>;
};

const defaultDeps: ClassesRemoveStudentDeps = {
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
      .eq("teacher_id", teacherId);

    if (error) {
      throw error;
    }
    if (!data?.length) return null;
    const classroom = data[0];
    return {
      id: classroom.id as string,
      teacherId: classroom.teacher_id as string,
      name: classroom.name as string,
      createdAt: classroom.created_at as string,
      archivedAt: (classroom.archived_at as string | null) ?? null,
    };
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
      const classId = typeof body?.classId === "string" ? body.classId.trim() : "";
      const studentId = typeof body?.studentId === "string" ? body.studentId : "";

      if (!classId) {
        return errorResponse("classId is required", 422);
      }
      if (!studentId) {
        return errorResponse("studentId is required", 422);
      }

      const classroom = await deps.getTeacherClass(profile.id, classId);
      if (!classroom) {
        return errorResponse("Classroom not found", 404);
      }
      try {
        assertWritableTeacherClass(classroom);
      } catch (error) {
        if (error instanceof Error && error.message === "This classroom is archived and read-only.") {
          return errorResponse("Archived classrooms are read-only", 409);
        }
        throw error;
      }

      await deps.removeMembership({ classId, studentId });
      return jsonResponse({ removed: true });
    } catch (error) {
      console.error("classes-remove-student failed", error);
      return errorResponse("We couldn't remove that student right now.", 500);
    }
  };
}
