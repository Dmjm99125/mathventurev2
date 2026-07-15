import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// GET /posts-list?classId=xxx
// Returns posts for the given class if the user is authorized (teacher of class or student in class).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);

  const url = new URL(req.url);
  const classId = url.searchParams.get("classId");
  if (!classId) return errorResponse("Missing classId", 400);

  // Check authorization
  if (profile.role === "student") {
    const { data: enrollment } = await adminClient
      .from("class_students")
      .select("class_id")
      .eq("class_id", classId)
      .eq("student_id", profile.id)
      .single();
    if (!enrollment) return errorResponse("Not enrolled in class", 403);
  } else if (profile.role === "teacher") {
    const { data: cls } = await adminClient
      .from("classes")
      .select("id")
      .eq("id", classId)
      .eq("teacher_id", profile.id)
      .single();
    if (!cls) return errorResponse("Not teacher of class", 403);
  } else {
    return errorResponse("Invalid role", 403);
  }

  // Fetch posts
  const { data: posts, error } = await adminClient
    .from("class_posts")
    .select("id, class_id, content, created_at, author_id, profiles!class_posts_author_id_fkey(full_name)")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);

  const shaped = (posts ?? []).map((p: any) => ({
    id: p.id,
    classId: p.class_id,
    content: p.content,
    createdAt: p.created_at,
    authorName: p.profiles?.full_name ?? "Teacher",
  }));

  return jsonResponse({ posts: shaped });
});
