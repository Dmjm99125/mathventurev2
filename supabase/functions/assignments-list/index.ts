import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// GET /assignments-list
// Student -> assignments targeted at them directly or at any class they're in,
//   each annotated with whether they've already completed it.
// Teacher -> assignments they created (optionally filter with ?classId=...).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);

  if (profile.role === "teacher") {
    const classId = new URL(req.url).searchParams.get("classId");
    let query = adminClient
      .from("assignments")
      .select("id, due_at, created_at, class_id, student_id, lesson_id, classes(name)")
      .eq("assigned_by", profile.id)
      .order("created_at", { ascending: false });
    if (classId) query = query.eq("class_id", classId);

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 500);

    return jsonResponse({
      assignments: (data ?? []).map((a: any) => ({
        id: a.id,
        lessonId: a.lesson_id,
        classId: a.class_id,
        className: a.classes?.name ?? null,
        studentId: a.student_id,
        dueAt: a.due_at,
        createdAt: a.created_at,
      })),
    });
  }

  const { data: classRows } = await adminClient
    .from("class_students")
    .select("class_id")
    .eq("student_id", profile.id);
  const classIds = (classRows ?? []).map((r: any) => r.class_id);

  const { data, error } = await adminClient
    .from("assignments")
    .select("id, due_at, created_at, lesson_id, class_id")
    .or(
      classIds.length
        ? `student_id.eq.${profile.id},class_id.in.(${classIds.join(",")})`
        : `student_id.eq.${profile.id}`,
    );

  if (error) return errorResponse(error.message, 500);

  const assignmentIds = (data ?? []).map((a: any) => a.id);
  const { data: attempts } = assignmentIds.length
    ? await adminClient
        .from("attempts")
        .select("assignment_id, status, current_game_order, score, max_score, updated_at")
        .eq("student_id", profile.id)
        .in("assignment_id", assignmentIds)
    : { data: [] };

  const attemptsByAssignment = new Map<string, any>();
  for (const attempt of attempts ?? []) {
    const existing = attemptsByAssignment.get(attempt.assignment_id);
    if (
      !existing
      || attempt.status === "completed"
      || (existing.status !== "completed" && attempt.updated_at > existing.updated_at)
    ) {
      attemptsByAssignment.set(attempt.assignment_id, attempt);
    }
  }

  return jsonResponse({
    assignments: (data ?? []).map((a: any) => ({
      id: a.id,
      lessonId: a.lesson_id,
      classId: a.class_id,
      dueAt: a.due_at,
      createdAt: a.created_at,
      status: attemptsByAssignment.get(a.id)?.status ?? "not_started",
      currentGameOrder: attemptsByAssignment.get(a.id)?.current_game_order ?? 0,
      score: attemptsByAssignment.get(a.id)?.score ?? 0,
      maxScore: attemptsByAssignment.get(a.id)?.max_score ?? 0,
      completed: attemptsByAssignment.get(a.id)?.status === "completed",
    })),
  });
});
