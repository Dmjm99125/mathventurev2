import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import { GAME_CATALOG } from "../../../frontend/src/lib/games/catalog.ts";
import {
  calculateDetailedCompletionPct,
  calculateDetailedLastPlayedPct,
} from "../../../frontend/src/lib/teacher/progress.ts";
import { decodeCursor, encodeCursor, PaginationInputError, parsePageRequest } from "../_shared/pagination.ts";
import { getTeacherSingletonClass } from "../_shared/teacher_singleton_class.ts";

type RosterSummaryStudent = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  joinedAt: string;
  appCompletionPct: number | null;
  lastPlayedPct: number | null;
  overallScore: number | null;
  overallMaxScore: number | null;
  overallScorePct: number | null;
};

type TeacherGameScore = {
  gameId: string;
  score: number;
  maxScore: number;
  scorePct: number;
  completedAt: string;
};

type TeacherAssignmentScore = {
  assignmentId: string;
  name: string;
  lessonId: string;
  dueAt: string | null;
  createdAt: string;
  status: "not_started" | "in_progress" | "completed";
  overallScore: number | null;
  overallMaxScore: number | null;
  overallScorePct: number | null;
  gameScores: TeacherGameScore[];
};

type DetailedRosterStudent = RosterSummaryStudent & {
  gameScores: TeacherGameScore[];
  assignments: TeacherAssignmentScore[];
};

type RosterPage = {
  students: RosterSummaryStudent[];
  nextCursor: string | null;
  hasMore: boolean;
};

type AssignmentRow = {
  id: string;
  name: string;
  lessonId: string;
  classId: string | null;
  studentId: string | null;
  dueAt: string | null;
  createdAt: string;
};

type DetailedGameResultRow = {
  attemptId: string;
  studentId: string;
  attemptStudentId?: string;
  gameId: string;
  score: number;
  maxScore: number;
  completedAt: string;
};

type AttemptRow = {
  attemptId: string;
  assignmentId: string | null;
  studentId: string;
  status: "in_progress" | "completed";
  score: number;
  maxScore: number;
  completedAt: string | null;
  updatedAt: string;
};

type ClassesRosterDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClassroom(
    teacherId: string,
  ): Promise<{ id: string; teacherId: string; name: string } | null>;
  listRosterPage?: (
    teacherId: string,
    pageSize: number,
    cursor: string | null,
  ) => Promise<RosterPage>;
  listStudentDetail?: (
    classId: string,
    studentId: string,
  ) => Promise<DetailedRosterStudent | null>;
  listRosterStudents?: (classId: string) => Promise<RosterSummaryStudent[]>;
  listAssignments?: (classId: string, studentIds: string[]) => Promise<AssignmentRow[]>;
  listCompletedAttempts?: (studentIds: string[], classId: string) => Promise<AttemptRow[]>;
  listDetailedGameResults?: (
    studentIds: string[],
    classId: string,
  ) => Promise<DetailedGameResultRow[]>;
};

type RosterCursor = {
  joinedAt: string;
  studentId: string;
};

type RosterRpcRow = RosterSummaryStudent;

type RosterRpcPayload = {
  students?: RosterRpcRow[];
  page?: {
    nextCursor?: { joinedAt?: string; studentId?: string } | null;
    hasMore?: boolean;
  };
};

type ClassStudentQueryRow = {
  joined_at: string;
  profiles:
    | {
        id: string;
        full_name: string;
        first_name: string | null;
        last_name: string | null;
      }
    | {
        id: string;
        full_name: string;
        first_name: string | null;
        last_name: string | null;
      }[]
    | null;
};

type AssignmentQueryRow = {
  id: string;
  name: string | null;
  lesson_id: string;
  class_id: string | null;
  student_id: string | null;
  due_at: string | null;
  created_at: string;
};

type AttemptQueryRow = {
  id: string;
  assignment_id: string | null;
  student_id: string;
  status: "in_progress" | "completed";
  score: number;
  max_score: number;
  completed_at: string | null;
  updated_at: string;
};

type AttemptGameResultQueryRow = {
  attempt_id: string;
  student_id: string;
  game_id: string;
  score: number;
  max_score: number;
  completed_at: string;
};

function toGameScores(rows: DetailedGameResultRow[]): TeacherGameScore[] {
  const latestByGameId = new Map<string, DetailedGameResultRow>();
  for (const row of rows) {
    const current = latestByGameId.get(row.gameId);
    if (!current || row.completedAt > current.completedAt) {
      latestByGameId.set(row.gameId, row);
    }
  }

  return Array.from(latestByGameId.values())
    .sort((left, right) => left.gameId.localeCompare(right.gameId))
    .map((row) => ({
      gameId: row.gameId,
      score: row.score,
      maxScore: row.maxScore,
      scorePct: row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0,
      completedAt: row.completedAt,
    }));
}

function toAssignmentScore(
  assignment: AssignmentRow,
  attempt: AttemptRow | null,
  rows: DetailedGameResultRow[],
): TeacherAssignmentScore {
  const isCompleted = attempt?.status === "completed";
  return {
    assignmentId: assignment.id,
    name: assignment.name,
    lessonId: assignment.lessonId,
    dueAt: assignment.dueAt,
    createdAt: assignment.createdAt,
    status: attempt?.status ?? "not_started",
    overallScore: isCompleted ? attempt.score : null,
    overallMaxScore: isCompleted ? attempt.maxScore : null,
    overallScorePct: isCompleted && attempt.maxScore > 0
      ? Math.round((attempt.score / attempt.maxScore) * 100)
      : null,
    gameScores: toGameScores(rows),
  };
}

function buildDetailedStudent(
  student: RosterSummaryStudent,
  assignments: AssignmentRow[],
  attempts: AttemptRow[],
  detailedRows: DetailedGameResultRow[],
): DetailedRosterStudent {
  const attemptsByAssignment = new Map<string, AttemptRow>();
  const attemptsById = new Map<string, AttemptRow>();
  for (const attempt of attempts) {
    attemptsById.set(attempt.attemptId, attempt);
    if (!attempt.assignmentId) continue;
    const current = attemptsByAssignment.get(attempt.assignmentId);
    if (!current || attempt.updatedAt > current.updatedAt) {
      attemptsByAssignment.set(attempt.assignmentId, attempt);
    }
  }

  const rowsByAttemptId = new Map<string, DetailedGameResultRow[]>();
  for (const row of detailedRows) {
    if (
      !attemptsById.has(row.attemptId)
      || (row.attemptStudentId && row.attemptStudentId !== row.studentId)
    ) continue;
    const rows = rowsByAttemptId.get(row.attemptId) ?? [];
    rows.push(row);
    rowsByAttemptId.set(row.attemptId, rows);
  }

  const ownRows = detailedRows.filter((row) =>
    row.studentId === student.id
    && (!row.attemptStudentId || row.attemptStudentId === row.studentId)
  );
  const latestAttempt = attempts
    .filter((attempt) => attempt.studentId === student.id && attempt.status === "completed" && attempt.completedAt)
    .sort((left, right) => (right.completedAt ?? "").localeCompare(left.completedAt ?? ""))[0] ?? null;

  return {
    ...student,
    appCompletionPct: calculateDetailedCompletionPct(ownRows, GAME_CATALOG.length),
    lastPlayedPct: calculateDetailedLastPlayedPct(ownRows),
    overallScore: latestAttempt?.score ?? null,
    overallMaxScore: latestAttempt?.maxScore ?? null,
    overallScorePct: latestAttempt && latestAttempt.maxScore > 0
      ? Math.round((latestAttempt.score / latestAttempt.maxScore) * 100)
      : null,
    gameScores: toGameScores(ownRows),
    assignments: assignments
      .map((assignment) => toAssignmentScore(
        assignment,
        attemptsByAssignment.get(assignment.id) ?? null,
        rowsByAttemptId.get(attemptsByAssignment.get(assignment.id)?.attemptId ?? "") ?? [],
      ))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  };
}

async function loadDefaultStudentDetail(
  classId: string,
  studentId: string,
): Promise<DetailedRosterStudent | null> {
  const { adminClient } = await import("../_shared/client.ts");
  const { data: enrollment, error: enrollmentError } = await adminClient
    .from("class_students")
    .select("joined_at, profiles(id, full_name, first_name, last_name)")
    .eq("class_id", classId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!enrollment) return null;

  const enrollmentRow = enrollment as unknown as ClassStudentQueryRow;
  const profile = Array.isArray(enrollmentRow.profiles)
    ? enrollmentRow.profiles[0]
    : enrollmentRow.profiles;
  if (!profile) return null;

  const student: RosterSummaryStudent = {
    id: profile.id,
    fullName: profile.full_name,
    firstName: profile.first_name ?? profile.full_name,
    lastName: profile.last_name ?? null,
    joinedAt: enrollmentRow.joined_at,
    appCompletionPct: null,
    lastPlayedPct: null,
    overallScore: null,
    overallMaxScore: null,
    overallScorePct: null,
  };

  const { data: assignmentData, error: assignmentError } = await adminClient
    .from("assignments")
    .select("id, name, lesson_id, class_id, student_id, due_at, created_at")
    .or(`class_id.eq.${classId},student_id.eq.${studentId}`)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1000);
  if (assignmentError) throw assignmentError;

  const assignments = ((assignmentData ?? []) as AssignmentQueryRow[]).map((row) => ({
    id: row.id,
    name: row.name?.trim() || row.lesson_id,
    lessonId: row.lesson_id,
    classId: row.class_id,
    studentId: row.student_id,
    dueAt: row.due_at,
    createdAt: row.created_at,
  }));
  const assignmentIds = assignments.map((assignment) => assignment.id);

  const { data: attemptData, error: attemptError } = assignmentIds.length
    ? await adminClient
      .from("attempts")
      .select("id, assignment_id, student_id, status, score, max_score, completed_at, updated_at")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .in("assignment_id", assignmentIds)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1000)
    : { data: [], error: null };
  if (attemptError) throw attemptError;

  const attempts = ((attemptData ?? []) as AttemptQueryRow[]).map((row) => ({
    attemptId: row.id,
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    status: row.status,
    score: row.score,
    maxScore: row.max_score,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  }));
  const attemptIds = attempts.map((attempt) => attempt.attemptId);
  const { data: resultData, error: resultError } = attemptIds.length
    ? await adminClient
      .from("attempt_game_results")
      .select("attempt_id, student_id, game_id, score, max_score, completed_at")
      .in("attempt_id", attemptIds)
      .order("completed_at", { ascending: false })
      .limit(10000)
    : { data: [], error: null };
  if (resultError) throw resultError;

  const detailedRows = ((resultData ?? []) as AttemptGameResultQueryRow[]).map((row) => ({
    attemptId: row.attempt_id,
    studentId: row.student_id,
    gameId: row.game_id,
    score: row.score,
    maxScore: row.max_score,
    completedAt: row.completed_at,
  }));

  return buildDetailedStudent(student, assignments, attempts, detailedRows);
}

const defaultDeps: ClassesRosterDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getTeacherClassroom(teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at")
      .eq("teacher_id", teacherId);
    if (error) throw error;

    const classrooms = (data ?? []).map((row) => ({
      id: row.id as string,
      teacherId: row.teacher_id as string,
      name: row.name as string,
      createdAt: row.created_at as string,
    }));
    if (!classrooms.length) return null;

    const classroom = await getTeacherSingletonClass(
      { listTeacherClasses: async () => classrooms },
      teacherId,
    );
    return { id: classroom.id, teacherId: classroom.teacherId, name: classroom.name };
  },
  async listRosterPage(teacherId, pageSize, cursor) {
    const { adminClient } = await import("../_shared/client.ts");
    const decoded = cursor ? decodeCursor<RosterCursor>(cursor) : null;
    const { data, error } = await adminClient.rpc("get_teacher_roster_page", {
      p_teacher_id: teacherId,
      p_page_size: pageSize,
      p_cursor_joined_at: decoded?.joinedAt ?? null,
      p_cursor_student_id: decoded?.studentId ?? null,
    });
    if (error) throw error;

    const payload = data as RosterRpcPayload | null;
    if (!payload || !Array.isArray(payload.students) || !payload.page) {
      throw new Error("Invalid teacher roster aggregate");
    }

    const rpcCursor = payload.page.nextCursor;
    return {
      students: payload.students,
      nextCursor: rpcCursor?.joinedAt && rpcCursor.studentId
        ? encodeCursor({ joinedAt: rpcCursor.joinedAt, studentId: rpcCursor.studentId })
        : null,
      hasMore: payload.page.hasMore === true,
    };
  },
  async listStudentDetail(classId, studentId) {
    return loadDefaultStudentDetail(classId, studentId);
  },
};

async function loadLegacyDetail(
  deps: ClassesRosterDeps,
  classId: string,
  studentId: string,
): Promise<DetailedRosterStudent | null> {
  if (!deps.listRosterStudents || !deps.listAssignments || !deps.listCompletedAttempts || !deps.listDetailedGameResults) {
    throw new Error("Roster detail dependencies are incomplete");
  }

  const students = await deps.listRosterStudents(classId);
  const student = students.find((row) => row.id === studentId);
  if (!student) return null;
  const [assignments, attempts, detailedRows] = await Promise.all([
    deps.listAssignments(classId, [studentId]),
    deps.listCompletedAttempts([studentId], classId),
    deps.listDetailedGameResults([studentId], classId),
  ]);
  return buildDetailedStudent(student, assignments, attempts, detailedRows);
}

export function createClassesRosterHandler(deps: ClassesRosterDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "GET") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can view rosters", 403);

      const classroom = await deps.getTeacherClassroom(profile.id);
      if (!classroom) return errorResponse("Classroom not found", 404);

      const url = new URL(req.url);
      const requestedStudentId = url.searchParams.get("studentId");
      if (requestedStudentId) {
        const student = deps.listStudentDetail
          ? await deps.listStudentDetail(classroom.id, requestedStudentId)
          : await loadLegacyDetail(deps, classroom.id, requestedStudentId);
        return student
          ? jsonResponse({ students: [student], page: { nextCursor: null, hasMore: false } })
          : errorResponse("Student not found in this classroom", 404);
      }

      const { pageSize, cursor } = parsePageRequest(url);
      if (deps.listRosterPage) {
        const page = await deps.listRosterPage(profile.id, pageSize, cursor);
        return jsonResponse({
          students: page.students.map((student) => ({
            ...student,
            gameScores: [],
            assignments: [],
          })),
          page: {
            nextCursor: page.nextCursor,
            hasMore: page.hasMore,
          },
        });
      }

      if (!deps.listRosterStudents) throw new Error("Roster page dependencies are incomplete");
      const students = await deps.listRosterStudents(classroom.id);
      return jsonResponse({
        students: students.slice(0, pageSize).map((student) => ({
          ...student,
          gameScores: [],
          assignments: [],
        })),
        page: {
          nextCursor: students.length > pageSize ? "legacy-more" : null,
          hasMore: students.length > pageSize,
        },
      });
    } catch (error) {
      if (error instanceof PaginationInputError) {
        return errorResponse(error.message, error.status);
      }
      console.error("classes-roster failed", error);
      return errorResponse("We couldn't load that class roster right now.", 500);
    }
  };
}
