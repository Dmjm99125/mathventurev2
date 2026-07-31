import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  HIDDEN_CLASSROOM_NAME,
  ensureTeacherSingletonClass,
  type TeacherSingletonClassPersistence,
} from "../_shared/teacher_singleton_class.ts";

type TeacherClassroomRow = {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
};

type ClassesCreateDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  ensureTeacherClassroom(teacherId: string): Promise<{
    id: string;
    createdAt: string;
    studentCount: number;
  }>;
};

const defaultTeacherClassPersistence: TeacherSingletonClassPersistence = {
  async listTeacherClasses(teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at")
      .eq("teacher_id", teacherId);

    if (error) {
      throw error;
    }

    return ((data ?? []) as TeacherClassroomRow[]).map((row) => ({
      id: row.id,
      teacherId: row.teacher_id,
      name: row.name,
      createdAt: row.created_at,
    }));
  },
  async insertTeacherClass(teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .insert({
        teacher_id: teacherId,
        name: HIDDEN_CLASSROOM_NAME,
        join_code: null,
      })
      .select("id, teacher_id, name, created_at")
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id as string,
      teacherId: data.teacher_id as string,
      name: data.name as string,
      createdAt: data.created_at as string,
    };
  },
};

const defaultDeps: ClassesCreateDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async ensureTeacherClassroom(teacherId) {
    const classroom = await ensureTeacherSingletonClass(
      defaultTeacherClassPersistence,
      teacherId,
    );

    const { adminClient } = await import("../_shared/client.ts");
    const { count, error } = await adminClient
      .from("class_students")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classroom.id);

    if (error) {
      throw error;
    }

    return {
      id: classroom.id,
      createdAt: classroom.createdAt,
      studentCount: count ?? 0,
    };
  },
};

export function createClassesCreateHandler(deps: ClassesCreateDeps = defaultDeps) {
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
        return errorResponse("Only teachers can access classrooms", 403);
      }

      const classroom = await deps.ensureTeacherClassroom(profile.id);
      return jsonResponse({ classroom }, 200);
    } catch (error) {
      console.error("classes-create failed", error);
      return errorResponse("We couldn't load that classroom right now.", 500);
    }
  };
}
