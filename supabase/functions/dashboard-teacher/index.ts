import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// GET /dashboard-teacher -- aggregated summary across all of the teacher's
// classes: totals, per-class averages, and the lessons students struggle
// with most (lowest average score).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);
  if (profile.role !== "teacher") return errorResponse("Only teachers have a teacher dashboard", 403);

  const { data: classes, error: classesError } = await adminClient
    .from("classes")
    .select("id, name, class_students(student_id)")
    .eq("teacher_id", profile.id);
  if (classesError) return errorResponse(classesError.message, 500);

  const allStudentIds = Array.from(
    new Set((classes ?? []).flatMap((c: any) => c.class_students.map((s: any) => s.student_id))),
  );

  const { data: attempts, error: attemptsError } = allStudentIds.length
    ? await adminClient
        .from("attempts")
        .select("student_id, lesson_id, score, max_score")
        .in("student_id", allStudentIds)
    : { data: [], error: null };
  if (attemptsError) return errorResponse(attemptsError.message, 500);

  const classSummaries = (classes ?? []).map((c: any) => {
    const studentIds = c.class_students.map((s: any) => s.student_id);
    const classAttempts = (attempts ?? []).filter((a: any) => studentIds.includes(a.student_id));
    const totalScore = classAttempts.reduce((sum: number, a: any) => sum + a.score, 0);
    const totalMax = classAttempts.reduce((sum: number, a: any) => sum + a.max_score, 0);
    return {
      id: c.id,
      name: c.name,
      studentCount: studentIds.length,
      attemptCount: classAttempts.length,
      averageScorePct: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null,
    };
  });

  const byLesson: Record<string, { totalScore: number; totalMax: number; attempts: number }> = {};
  for (const a of attempts ?? []) {
    const key = a.lesson_id;
    byLesson[key] ??= { totalScore: 0, totalMax: 0, attempts: 0 };
    byLesson[key].totalScore += a.score;
    byLesson[key].totalMax += a.max_score;
    byLesson[key].attempts += 1;
  }

  const strugglingLessons = Object.entries(byLesson)
    .map(([lessonId, v]) => ({
      lessonId,
      attempts: v.attempts,
      averageScorePct: v.totalMax > 0 ? Math.round((v.totalScore / v.totalMax) * 100) : 0,
    }))
    .sort((a, b) => a.averageScorePct - b.averageScorePct)
    .slice(0, 5);

  return jsonResponse({
    classCount: (classes ?? []).length,
    studentCount: allStudentIds.length,
    classes: classSummaries,
    strugglingLessons,
  });
});

