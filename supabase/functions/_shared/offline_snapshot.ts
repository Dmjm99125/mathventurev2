export type OfflineTeacherSnapshot = {
  revision: number;
  classroom: Record<string, unknown> | null;
  students: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
  attempts: Record<string, unknown>[];
  gameResults: Record<string, unknown>[];
  posts: Record<string, unknown>[];
};

type QueryResult<T> = { data: T | null; error: { message: string } | null };

function assertQuery<T>(result: QueryResult<T>, label: string): T {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data as T;
}

function timestampOf(value: unknown): number {
  if (typeof value !== "string") return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function snapshotRevision(rows: Record<string, unknown>[]): number {
  return rows.reduce((latest, row) => {
    return Math.max(
      latest,
      timestampOf(row.created_at),
      timestampOf(row.updated_at),
      timestampOf(row.completed_at),
      timestampOf(row.joined_at),
    );
  }, 0);
}

export async function getOfflineTeacherSnapshot(
  teacherId: string,
): Promise<OfflineTeacherSnapshot> {
  const { adminClient } = await import("./client.ts");

  const classroomResult = await adminClient
    .from("classes")
    .select("id, teacher_id, name, join_code, created_at")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const classroom = assertQuery(classroomResult, "classes") as Record<string, unknown> | null;

  if (!classroom) {
    return {
      revision: 0,
      classroom: null,
      students: [],
      assignments: [],
      attempts: [],
      gameResults: [],
      posts: [],
    };
  }

  const classId = String(classroom.id);
  const studentsResult = await adminClient
    .from("class_students")
    .select(
      "class_id, student_id, joined_at, profiles!class_students_student_id_fkey(id, role, full_name)",
    )
    .eq("class_id", classId)
    .order("joined_at", { ascending: true });
  const students = (assertQuery(studentsResult, "class_students") ?? []) as Record<string, unknown>[];

  const assignmentsResult = await adminClient
    .from("assignments")
    .select(
      "id, name, lesson_id, class_id, student_id, assigned_by, due_at, created_at",
    )
    .eq("class_id", classId)
    .order("created_at", { ascending: true });
  const assignments = (assertQuery(assignmentsResult, "assignments") ?? []) as Record<string, unknown>[];

  const attemptsResult = await adminClient
    .from("attempts")
    .select(
      "id, student_id, lesson_id, assignment_id, class_id, score, max_score, duration_seconds, status, quiz_mode, current_game_order, started_at, updated_at, completed_at",
    )
    .eq("class_id", classId)
    .order("updated_at", { ascending: true });
  const attempts = (assertQuery(attemptsResult, "attempts") ?? []) as Record<string, unknown>[];

  const attemptIds = attempts
    .map((attempt) => attempt.id)
    .filter((id): id is string => typeof id === "string");
  let gameResults: Record<string, unknown>[] = [];
  if (attemptIds.length > 0) {
    const gameResultsResult = await adminClient
      .from("attempt_game_results")
      .select(
        "id, attempt_id, student_id, topic_id, game_id, game_order, score, max_score, score_pct, passed, completed_at",
      )
      .in("attempt_id", attemptIds)
      .order("completed_at", { ascending: true });
    gameResults = (assertQuery(gameResultsResult, "attempt_game_results") ?? []) as Record<string, unknown>[];
  }

  const postsResult = await adminClient
    .from("class_posts")
    .select("id, class_id, author_id, content, created_at")
    .eq("class_id", classId)
    .order("created_at", { ascending: true });
  const posts = (assertQuery(postsResult, "class_posts") ?? []) as Record<string, unknown>[];

  const allRows = [classroom, ...students, ...assignments, ...attempts, ...gameResults, ...posts];
  return {
    revision: snapshotRevision(allRows),
    classroom,
    students,
    assignments,
    attempts,
    gameResults,
    posts,
  };
}
