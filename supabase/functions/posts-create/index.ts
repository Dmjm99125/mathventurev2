import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// POST /posts-create
// Teacher -> creates a post for a specific class
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);
  if (profile.role !== "teacher") return errorResponse("Only teachers can post", 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const { classId, content } = body;
  if (!classId || !content) return errorResponse("Missing classId or content", 400);

  // Check if teacher owns class
  const { data: cls } = await adminClient
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_id", profile.id)
    .single();

  if (!cls) return errorResponse("Not teacher of class", 403);

  // Create post
  const { data: post, error } = await adminClient
    .from("class_posts")
    .insert({
      class_id: classId,
      author_id: profile.id,
      content,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ post });
});
