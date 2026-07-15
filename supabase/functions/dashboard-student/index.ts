import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// GET /dashboard-student -- aggregated summary for the signed-in student:
// streak and raw attempts.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);
  if (profile.role !== "student") return errorResponse("Only students have a student dashboard", 403);

  const { data: attempts, error: attemptsError } = await adminClient
    .from("attempts")
    .select("lesson_id, score, max_score, completed_at")
    .eq("student_id", profile.id)
    .order("completed_at", { ascending: false });
  if (attemptsError) return errorResponse(attemptsError.message, 500);

  const completedLessonIds = new Set((attempts ?? []).map((a: any) => a.lesson_id));

  // Simple day-streak: consecutive calendar days (from today backwards) with at least one attempt.
  const days = new Set((attempts ?? []).map((a: any) => a.completed_at.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return jsonResponse({
    completedLessons: completedLessonIds.size,
    streakDays: streak,
    recentAttempts: (attempts ?? []).map((a: any) => ({
      lessonId: a.lesson_id,
      score: a.score,
      maxScore: a.max_score,
      completedAt: a.completed_at,
    })),
  });
});

