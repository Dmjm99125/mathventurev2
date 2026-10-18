import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { TeacherClassSummary } from "../classes-list/handler.ts";

export type ClassesCreateDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  createTeacherClass(
    teacherId: string,
    name: string,
  ): Promise<TeacherClassSummary>;
};

const defaultDeps: ClassesCreateDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async createTeacherClass(teacherId, name) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .insert({
        teacher_id: teacherId,
        name,
        join_code: null,
        archived_at: null,
      })
      .select("id, teacher_id, name, created_at, archived_at")
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id as string,
      teacherId: data.teacher_id as string,
      name: data.name as string,
      createdAt: data.created_at as string,
      archivedAt: (data.archived_at as string | null) ?? null,
      studentCount: 0,
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

      const body = await req.json().catch(() => null) as { name?: unknown } | null;
      const name = typeof body?.name === "string" ? body.name.trim() : "";
      if (!name) {
        return errorResponse("Class name is required", 422);
      }
      if (name.length > 120) {
        return errorResponse("Class name is too long", 422);
      }

      const classroom = await deps.createTeacherClass(profile.id, name);
      return jsonResponse({ classroom }, 201);
    } catch (error) {
      console.error("classes-create failed", error);
      return errorResponse("We couldn't create that classroom right now.", 500);
    }
  };
}
