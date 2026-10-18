import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { TeacherOwnedClass } from "../_shared/teacher_class_access.ts";

export type PostsCreateDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClass(classId: string, teacherId: string): Promise<TeacherOwnedClass | null>;
  createPost(input: { classId: string; teacherId: string; content: string }): Promise<unknown>;
};

const defaultDeps: PostsCreateDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getTeacherClass(classId, teacherId) {
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
  async createPost({ classId, teacherId, content }) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_posts")
      .insert({ class_id: classId, author_id: teacherId, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export function createPostsCreateHandler(deps: PostsCreateDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can post", 403);

      const body = await req.json().catch(() => null) as {
        classId?: unknown;
        content?: unknown;
      } | null;
      const classId = typeof body?.classId === "string" ? body.classId.trim() : "";
      const content = typeof body?.content === "string" ? body.content.trim() : "";
      if (!classId || !content) return errorResponse("Missing classId or content", 400);

      const classroom = await deps.getTeacherClass(classId, profile.id);
      if (!classroom) return errorResponse("Not teacher of class", 403);
      if (classroom.archivedAt !== null) {
        return errorResponse("Archived classrooms are read-only", 409);
      }

      const post = await deps.createPost({ classId, teacherId: profile.id, content });
      return jsonResponse({ post });
    } catch (error) {
      console.error("posts-create failed", error);
      return errorResponse("We couldn't create that post right now.", 500);
    }
  };
}
