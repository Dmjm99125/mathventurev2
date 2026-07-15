import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// POST /attempts-submit { lessonId, assignmentId?, score, maxScore, durationSeconds? }
// Student only. Records a completed play-through of a lesson.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);
  if (profile.role !== "student") return errorResponse("Only students can submit attempts", 403);

  const body = await req.json().catch(() => null);
  const lessonId = body?.lessonId;
  const score = Number(body?.score);
  const maxScore = Number(body?.maxScore);
  const assignmentId = body?.assignmentId ?? null;
  const durationSeconds = body?.durationSeconds != null ? Number(body.durationSeconds) : null;

  if (!lessonId) return errorResponse("lessonId is required", 422);
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    return errorResponse("score and maxScore must be valid numbers", 422);
  }

  const { data, error } = await adminClient
    .from("attempts")
    .insert({
      student_id: profile.id,
      lesson_id: lessonId,
      assignment_id: assignmentId,
      score,
      max_score: maxScore,
      duration_seconds: durationSeconds,
    })
    .select("id, lesson_id, score, max_score, completed_at")
    .single();

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ attempt: data }, 201);
});
