import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import {
  decodeCursor,
  encodeCursor,
  PaginationInputError,
  parsePageRequest,
} from "../_shared/pagination.ts";
import type { TeacherOwnedClass } from "../_shared/teacher_class_access.ts";

export type AssignmentListRecord = {
  id: string;
  name: string;
  lessonId: string;
  classId: string | null;
  studentId?: string | null;
  className?: string | null;
  dueAt: string | null;
  createdAt: string;
  studentScores?: TeacherAssignmentStudentScore[];
};

export type TeacherAssignmentStudentScore = {
  studentId: string;
  status: "in_progress" | "completed";
  overallScore: number | null;
  overallMaxScore: number | null;
  overallScorePct: number | null;
  gameScores: TeacherAssignmentGameScore[];
};

type TeacherAssignmentGameScore = {
  gameId: string;
  score: number;
  maxScore: number;
  scorePct: number;
  completedAt: string;
};

export type AssignmentListAttempt = {
  status: "in_progress" | "completed";
  currentGameOrder: number;
  score: number;
  maxScore: number;
  updatedAt?: string;
};

export type AssignmentListPage = {
  assignments: AssignmentListRecord[];
  nextCursor: string | null;
  hasMore: boolean;
};

type AssignmentSource = AssignmentListRecord[] | AssignmentListPage;

export type AssignmentsListDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClass?(teacherId: string, classId: string): Promise<TeacherOwnedClass | null>;
  listTeacherAssignments(
    teacherId: string,
    classId: string,
    pageSize?: number,
    cursor?: string | null,
  ): Promise<AssignmentSource>;
  listStudentAssignments(
    studentId: string,
    pageSize?: number,
    cursor?: string | null,
  ): Promise<AssignmentSource>;
  listAttempts(studentId: string, assignmentIds: string[]): Promise<Map<string, AssignmentListAttempt>>;
  listTeacherAssignmentScores?: (
    classId: string,
    assignmentIds: string[],
  ) => Promise<Map<string, TeacherAssignmentStudentScore[]>>;
};

type AssignmentQueryRow = {
  id: string;
  name: string | null;
  due_at: string | null;
  created_at: string;
  class_id: string | null;
  student_id: string | null;
  lesson_id: string;
  classes?: { name: string } | { name: string }[] | null;
};

type AssignmentCursor = {
  createdAt: string;
  id: string;
};

type TeacherAttemptQueryRow = {
  id: string;
  assignment_id: string | null;
  student_id: string;
  status: "in_progress" | "completed";
  score: number;
  max_score: number;
  updated_at: string;
};

type TeacherGameResultQueryRow = {
  attempt_id: string;
  game_id: string;
  score: number;
  max_score: number;
  score_pct: number;
  completed_at: string;
};

function mapAssignment(row: AssignmentQueryRow): AssignmentListRecord {
  const classroom = Array.isArray(row.classes) ? row.classes[0] : row.classes;
  return {
    id: row.id,
    name: row.name?.trim() || row.lesson_id,
    lessonId: row.lesson_id,
    classId: row.class_id ?? null,
    studentId: row.student_id ?? null,
    className: classroom?.name ?? null,
    dueAt: row.due_at ?? null,
    createdAt: row.created_at,
  };
}

function pageFromRows(rows: AssignmentListRecord[], pageSize: number): AssignmentListPage {
  const hasMore = rows.length > pageSize;
  const assignments = rows.slice(0, pageSize);
  const last = assignments.at(-1);
  return {
    assignments,
    nextCursor: hasMore && last
      ? encodeCursor({ createdAt: last.createdAt, id: last.id })
      : null,
    hasMore,
  };
}

function normalizePage(source: AssignmentSource, pageSize: number): AssignmentListPage {
  return Array.isArray(source) ? pageFromRows(source, pageSize) : source;
}

const defaultDeps: AssignmentsListDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getTeacherClass(teacherId, classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at, archived_at")
      .eq("id", classId)
      .eq("teacher_id", teacherId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id as string,
      teacherId: data.teacher_id as string,
      name: data.name as string,
      createdAt: data.created_at as string,
      archivedAt: (data.archived_at as string | null) ?? null,
    };
  },
  async listTeacherAssignments(teacherId, classId, pageSize = 50, cursor = null) {
    const { adminClient } = await import("../_shared/client.ts");
    let query = adminClient
      .from("assignments")
      .select("id, name, due_at, created_at, class_id, student_id, lesson_id, classes(name)")
      .eq("class_id", classId)
      .eq("assigned_by", teacherId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(pageSize + 1);
    if (cursor) {
      const decoded = decodeCursor<AssignmentCursor>(cursor);
      query = query.or(
        `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`,
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    return pageFromRows((data ?? []).map((row) => mapAssignment(row as AssignmentQueryRow),), pageSize);
  },
  async listStudentAssignments(studentId, pageSize = 50, cursor = null) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data: classRows, error: classError } = await adminClient
      .from("class_students")
      .select("class_id")
      .eq("student_id", studentId)
      .limit(100);
    if (classError) throw classError;
    const classIds = (classRows ?? []).map((row: { class_id: string }) => row.class_id);

    const targetFilter = classIds.length
      ? `student_id.eq.${studentId},class_id.in.(${classIds.join(",")})`
      : `student_id.eq.${studentId}`;
    let query = adminClient
      .from("assignments")
      .select("id, name, due_at, created_at, lesson_id, class_id, student_id")
      .or(targetFilter)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(pageSize + 1);
    if (cursor) {
      const decoded = decodeCursor<AssignmentCursor>(cursor);
      query = query.or(
        `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`,
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    return pageFromRows((data ?? []).map((row) => mapAssignment(row as AssignmentQueryRow),), pageSize);
  },
  async listAttempts(studentId, assignmentIds) {
    if (!assignmentIds.length) return new Map();

    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .select("assignment_id, status, current_game_order, score, max_score, updated_at, id")
      .eq("student_id", studentId)
      .in("assignment_id", assignmentIds)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(Math.min(1000, assignmentIds.length * 10));
    if (error) throw error;

    const attemptsByAssignment = new Map<string, AssignmentListAttempt>();
    for (const row of data ?? []) {
      if (!row.assignment_id || attemptsByAssignment.has(row.assignment_id)) continue;
      attemptsByAssignment.set(row.assignment_id, {
        status: row.status as AssignmentListAttempt["status"],
        currentGameOrder: row.current_game_order,
        score: row.score,
        maxScore: row.max_score,
        updatedAt: row.updated_at,
      });
    }
    return attemptsByAssignment;
  },
  async listTeacherAssignmentScores(classId, assignmentIds) {
    if (!assignmentIds.length) return new Map();

    const { adminClient } = await import("../_shared/client.ts");
    const { data: attemptData, error: attemptError } = await adminClient
      .from("attempts")
      .select("id, assignment_id, student_id, status, score, max_score, updated_at")
      .eq("class_id", classId)
      .in("assignment_id", assignmentIds)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(Math.min(10000, assignmentIds.length * 200));
    if (attemptError) throw attemptError;

    const latestAttempts = new Map<string, TeacherAttemptQueryRow>();
    for (const row of (attemptData ?? []) as TeacherAttemptQueryRow[]) {
      if (!row.assignment_id) continue;
      const key = `${row.assignment_id}:${row.student_id}`;
      if (!latestAttempts.has(key)) latestAttempts.set(key, row);
    }

    const attemptIds = Array.from(latestAttempts.values()).map((row) => row.id);
    const { data: resultData, error: resultError } = attemptIds.length
      ? await adminClient
        .from("attempt_game_results")
        .select("attempt_id, game_id, score, max_score, score_pct, completed_at")
        .in("attempt_id", attemptIds)
        .order("completed_at", { ascending: false })
      : { data: [], error: null };
    if (resultError) throw resultError;

    const gameScoresByAttempt = new Map<string, TeacherAssignmentGameScore[]>();
    for (const row of (resultData ?? []) as TeacherGameResultQueryRow[]) {
      const scores = gameScoresByAttempt.get(row.attempt_id) ?? [];
      scores.push({
        gameId: row.game_id,
        score: row.score,
        maxScore: row.max_score,
        scorePct: row.max_score > 0 ? Math.round((row.score / row.max_score) * 100) : row.score_pct,
        completedAt: row.completed_at,
      });
      gameScoresByAttempt.set(row.attempt_id, scores);
    }

    const scoresByAssignment = new Map<string, TeacherAssignmentStudentScore[]>();
    for (const attempt of latestAttempts.values()) {
      if (!attempt.assignment_id) continue;
      const scores = scoresByAssignment.get(attempt.assignment_id) ?? [];
      const isCompleted = attempt.status === "completed";
      scores.push({
        studentId: attempt.student_id,
        status: attempt.status,
        overallScore: isCompleted ? attempt.score : null,
        overallMaxScore: isCompleted ? attempt.max_score : null,
        overallScorePct: isCompleted && attempt.max_score > 0
          ? Math.round((attempt.score / attempt.max_score) * 100)
          : null,
        gameScores: gameScoresByAttempt.get(attempt.id) ?? [],
      });
      scoresByAssignment.set(attempt.assignment_id, scores);
    }

    return scoresByAssignment;
  },
};

export function createAssignmentsListHandler(deps: AssignmentsListDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "GET") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);

      const { pageSize, cursor } = parsePageRequest(new URL(req.url));
      if (profile.role === "teacher") {
        const classId = new URL(req.url).searchParams.get("classId");
        if (!classId) return errorResponse("classId is required", 422);
        if (deps.getTeacherClass && !(await deps.getTeacherClass(profile.id, classId))) {
          return errorResponse("Classroom not found", 404);
        }
        const source = await deps.listTeacherAssignments(profile.id, classId, pageSize, cursor);
        const page = normalizePage(source, pageSize);
        const scoresByAssignment = deps.listTeacherAssignmentScores
          ? await deps.listTeacherAssignmentScores(classId, page.assignments.map((assignment) => assignment.id))
          : new Map<string, TeacherAssignmentStudentScore[]>();
        return jsonResponse({
          assignments: page.assignments.map((assignment) => ({
            ...assignment,
            studentScores: scoresByAssignment.get(assignment.id) ?? [],
          })),
          page: { nextCursor: page.nextCursor, hasMore: page.hasMore },
        });
      }

      const source = await deps.listStudentAssignments(profile.id, pageSize, cursor);
      const page = normalizePage(source, pageSize);
      const attemptsByAssignment = await deps.listAttempts(
        profile.id,
        page.assignments.map((assignment) => assignment.id),
      );

      return jsonResponse({
        assignments: page.assignments.map((assignment) => {
          const attempt = attemptsByAssignment.get(assignment.id);
          return {
            ...assignment,
            status: attempt?.status ?? "not_started",
            currentGameOrder: attempt?.currentGameOrder ?? 0,
            score: attempt?.score ?? 0,
            maxScore: attempt?.maxScore ?? 0,
            completed: attempt?.status === "completed",
          };
        }),
        page: { nextCursor: page.nextCursor, hasMore: page.hasMore },
      });
    } catch (error) {
      if (error instanceof PaginationInputError) return errorResponse(error.message, error.status);
      console.error("assignments-list failed", error);
      return errorResponse("We couldn't load assignments right now.", 500);
    }
  };
}
