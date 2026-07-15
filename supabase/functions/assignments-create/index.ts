import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// POST /assignments-create { lessonId, classId? , studentId?, dueAt? }
// Teacher only. Exactly one of classId / studentId must be provided.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);
  if (profile.role !== "teacher") return errorResponse("Only teachers can create assignments", 403);

  const body = await req.json().catch(() => null);
  const lessonId = body?.lessonId;
  const classId = body?.classId ?? null;
  const studentId = body?.studentId ?? null;
  const dueAt = body?.dueAt ?? null;

  if (!lessonId) return errorResponse("lessonId is required", 422);
  if (!classId && !studentId) return errorResponse("Provide a classId or studentId", 422);

  if (classId) {
    const { data: klass } = await adminClient
      .from("classes")
      .select("teacher_id")
      .eq("id", classId)
      .maybeSingle();
    if (!klass || klass.teacher_id !== profile.id) return errorResponse("Forbidden", 403);
  }

  const { data, error } = await adminClient
    .from("assignments")
    .insert({
      lesson_id: lessonId,
      class_id: classId,
      student_id: studentId,
      assigned_by: profile.id,
      due_at: dueAt,
    })
    .select("id, lesson_id, class_id, student_id, due_at, created_at")
    .single();

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ assignment: data }, 201);
});
