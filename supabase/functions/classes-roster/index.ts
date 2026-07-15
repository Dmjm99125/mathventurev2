import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// GET /classes-roster?classId=... -- teacher only, must own the class.
// Returns each enrolled student with a lightweight progress summary.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);
  if (profile.role !== "teacher") return errorResponse("Only teachers can view rosters", 403);

  const classId = new URL(req.url).searchParams.get("classId");
  if (!classId) return errorResponse("classId is required", 422);

  const { data: klass, error: klassError } = await adminClient
    .from("classes")
    .select("id, teacher_id")
    .eq("id", classId)
    .single();

  if (klassError || !klass) return errorResponse("Class not found", 404);
  if (klass.teacher_id !== profile.id) return errorResponse("Forbidden", 403);

  const { data: roster, error: rosterError } = await adminClient
    .from("class_students")
    .select("joined_at, profiles(id, full_name)")
    .eq("class_id", classId);

  if (rosterError) return errorResponse(rosterError.message, 500);

  const studentIds = (roster ?? []).map((r: any) => r.profiles.id);

  const { data: attempts, error: attemptsError } = studentIds.length
    ? await adminClient
        .from("attempts")
        .select("student_id, score, max_score, completed_at")
        .in("student_id", studentIds)
    : { data: [], error: null };

  if (attemptsError) return errorResponse(attemptsError.message, 500);

  const students = (roster ?? []).map((r: any) => {
    const own = (attempts ?? []).filter((a: any) => a.student_id === r.profiles.id);
    const totalScore = own.reduce((sum: number, a: any) => sum + a.score, 0);
    const totalMax = own.reduce((sum: number, a: any) => sum + a.max_score, 0);
    return {
      id: r.profiles.id,
      fullName: r.profiles.full_name,
      joinedAt: r.joined_at,
      lessonsCompleted: own.length,
      averageScorePct: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null,
      lastActive: own.length
        ? own.map((a: any) => a.completed_at).sort().at(-1)
        : null,
    };
  });

  return jsonResponse({ students });
});
