export type OfflineTeacherSnapshot = {
  revision: number;
  classrooms: Record<string, unknown>[];
  classroom?: Record<string, unknown> | null;
  students: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
  attempts: Record<string, unknown>[];
  gameResults: Record<string, unknown>[];
  posts: Record<string, unknown>[];
  freePlaySessions: Record<string, unknown>[];
  freePlayProgress: Record<string, unknown>[];
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
    .select("id, teacher_id, name, join_code, created_at, archived_at")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: true });
  const classrooms = (assertQuery(classroomResult, "classes") ?? []) as Record<string, unknown>[];

  if (!classrooms.length) {
    return {
      revision: 0,
      classrooms: [],
      students: [],
      assignments: [],
      attempts: [],
      gameResults: [],
      posts: [],
      freePlaySessions: [],
      freePlayProgress: [],
    };
  }

  const classIds = classrooms
    .map((classroom) => classroom.id)
    .filter((id): id is string => typeof id === "string");
  const studentsResult = await adminClient
    .from("class_students")
    .select(
      "class_id, student_id, joined_at, profiles!class_students_student_id_fkey(id, role, full_name)",
    )
    .in("class_id", classIds)
    .order("joined_at", { ascending: true });
  const students = (assertQuery(studentsResult, "class_students") ?? []) as Record<string, unknown>[];

  const assignmentsResult = await adminClient
    .from("assignments")
    .select(
      "id, name, lesson_id, class_id, student_id, assigned_by, due_at, created_at",
    )
    .in("class_id", classIds)
    .order("created_at", { ascending: true });
  const assignments = (assertQuery(assignmentsResult, "assignments") ?? []) as Record<string, unknown>[];

  const attemptsResult = await adminClient
    .from("attempts")
    .select(
      "id, student_id, lesson_id, assignment_id, class_id, score, max_score, duration_seconds, status, quiz_mode, current_game_order, started_at, updated_at, completed_at",
    )
    .in("class_id", classIds)
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
    const rawResults = (assertQuery(gameResultsResult, "attempt_game_results") ?? []) as Record<string, unknown>[];
    const classIdByAttemptId = new Map(
      attempts.flatMap((attempt) => typeof attempt.id === "string" && typeof attempt.class_id === "string"
        ? [[attempt.id, attempt.class_id] as const]
        : []),
    );
    gameResults = rawResults.map((result) => ({
      ...result,
      class_id: typeof result.class_id === "string"
        ? result.class_id
        : classIdByAttemptId.get(String(result.attempt_id)) ?? null,
    }));
  }

  const postsResult = await adminClient
    .from("class_posts")
    .select("id, class_id, author_id, content, created_at")
    .in("class_id", classIds)
    .order("created_at", { ascending: true });
  const posts = (assertQuery(postsResult, "class_posts") ?? []) as Record<string, unknown>[];

  const studentIds = students
    .map((row) => row.student_id)
    .filter((id): id is string => typeof id === "string");
  const profileIds = Array.from(new Set([teacherId, ...studentIds]));
  const freePlaySessionsResult = await adminClient
    .from("free_play_sessions")
    .select("id, profile_id, game_id, started_at, completed_at, score, max_score, data, created_at, updated_at")
    .in("profile_id", profileIds)
    .order("updated_at", { ascending: true });
  const freePlaySessions = (assertQuery(freePlaySessionsResult, "free_play_sessions") ?? []) as Record<string, unknown>[];

  const freePlayProgressResult = await adminClient
    .from("free_play_progress")
    .select("id, profile_id, game_id, best_score, best_max_score, play_count, last_played_at, data, created_at, updated_at")
    .in("profile_id", profileIds)
    .order("updated_at", { ascending: true });
  const freePlayProgress = (assertQuery(freePlayProgressResult, "free_play_progress") ?? []) as Record<string, unknown>[];

  const allRows = [...classrooms, ...students, ...assignments, ...attempts, ...gameResults, ...posts, ...freePlaySessions, ...freePlayProgress];
  return {
    revision: snapshotRevision(allRows),
    classrooms,
    students,
    assignments,
    attempts,
    gameResults,
    posts,
    freePlaySessions,
    freePlayProgress,
  };
}
