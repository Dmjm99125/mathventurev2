import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { TeacherOwnedClass } from "../_shared/teacher_class_access.ts";

type PostRecord = {
  id: string;
  classId: string;
  content: string;
  createdAt: string;
  authorName: string;
};

export type PostsListDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClass?(teacherId: string, classId: string): Promise<TeacherOwnedClass | null>;
  isStudentEnrolled?(studentId: string, classId: string): Promise<boolean>;
  listPosts(classId: string): Promise<PostRecord[]>;
};

const defaultDeps: PostsListDeps = {
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
  async isStudentEnrolled(studentId, classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select("class_id")
      .eq("class_id", classId)
      .eq("student_id", studentId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },
  async listPosts(classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_posts")
      .select("id, class_id, content, created_at, author_id, profiles!class_posts_author_id_fkey(full_name)")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((post: {
      id: string;
      class_id: string;
      content: string;
      created_at: string;
      profiles?: { full_name: string } | { full_name: string }[] | null;
    }) => ({
      id: post.id,
      classId: post.class_id,
      content: post.content,
      createdAt: post.created_at,
      authorName: (Array.isArray(post.profiles) ? post.profiles[0] : post.profiles)?.full_name ?? "Teacher",
    }));
  },
};

export function createPostsListHandler(deps: PostsListDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "GET") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);

      const classId = new URL(req.url).searchParams.get("classId");
      if (!classId) return errorResponse("Missing classId", 400);

      if (profile.role === "student") {
        if (!deps.isStudentEnrolled || !(await deps.isStudentEnrolled(profile.id, classId))) {
          return errorResponse("Not enrolled in class", 403);
        }
      } else if (profile.role === "teacher") {
        if (!deps.getTeacherClass || !(await deps.getTeacherClass(profile.id, classId))) {
          return errorResponse("Not teacher of class", 403);
        }
      } else {
        return errorResponse("Invalid role", 403);
      }

      return jsonResponse({ posts: await deps.listPosts(classId) });
    } catch (error) {
      console.error("posts-list failed", error);
      return errorResponse("We couldn't load class posts right now.", 500);
    }
  };
}
