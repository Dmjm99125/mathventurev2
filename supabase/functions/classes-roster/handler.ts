import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import { GAME_CATALOG } from "../../../src/lib/games/catalog.ts";
import {
  calculateDetailedCompletionPct,
  calculateDetailedLastPlayedPct,
} from "../../../src/lib/teacher/progress.ts";
import { getTeacherSingletonClass } from "../_shared/teacher_singleton_class.ts";

type RosterStudentRow = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  joinedAt: string;
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
  attemptStudentId: string;
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
  listRosterStudents(classId: string): Promise<RosterStudentRow[]>;
  listAssignments(classId: string, studentIds: string[]): Promise<AssignmentRow[]>;
  listCompletedAttempts(studentIds: string[], classId: string): Promise<AttemptRow[]>;
  listDetailedGameResults(studentIds: string[], classId: string): Promise<DetailedGameResultRow[]>;
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
  attempts: {
    student_id: string;
  } | {
    student_id: string;
  }[];
};

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
    return {
      id: classroom.id,
      teacherId: classroom.teacherId,
      name: classroom.name,
    };
  },
  async listRosterStudents(classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select("joined_at, profiles(id, full_name, first_name, last_name)")
      .eq("class_id", classId);
    if (error) throw error;

    return ((data ?? []) as unknown as ClassStudentQueryRow[])
      .map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        if (!profile) return null;
        return {
          id: profile.id,
          fullName: profile.full_name,
          firstName: profile.first_name ?? profile.full_name,
          lastName: profile.last_name ?? null,
          joinedAt: row.joined_at,
        };
      })
      .filter((row): row is RosterStudentRow => row !== null);
  },
  async listAssignments(classId, studentIds) {
    const { adminClient } = await import("../_shared/client.ts");
    let query = adminClient
      .from("assignments")
      .select("id, name, lesson_id, class_id, student_id, due_at, created_at")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (studentIds.length) {
      query = adminClient
        .from("assignments")
        .select("id, name, lesson_id, class_id, student_id, due_at, created_at")
        .or("class_id.eq." + classId + ",student_id.in.(" + studentIds.join(",") + ")")
        .order("created_at", { ascending: false });
    }
    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row) => {
      const value = row as AssignmentQueryRow;
      return {
        id: value.id,
        name: value.name?.trim() || value.lesson_id,
        lessonId: value.lesson_id,
        classId: value.class_id,
        studentId: value.student_id,
        dueAt: value.due_at,
        createdAt: value.created_at,
      };
    });
  },
  async listCompletedAttempts(studentIds, classId) {
    if (!studentIds.length) return [];

    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .select("id, assignment_id, student_id, status, score, max_score, completed_at, updated_at")
      .in("student_id", studentIds)
      .eq("class_id", classId);
    if (error) throw error;

    return (data ?? []).map((row) => {
      const value = row as AttemptQueryRow;
      return {
        attemptId: value.id,
        assignmentId: value.assignment_id,
        studentId: value.student_id,
        status: value.status,
        score: value.score,
        maxScore: value.max_score,
        completedAt: value.completed_at,
        updatedAt: value.updated_at,
      };
    });
  },
  async listDetailedGameResults(studentIds, classId) {
    if (!studentIds.length) return [];

    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempt_game_results")
      .select("attempt_id, student_id, game_id, score, max_score, completed_at, attempts!inner(student_id, class_id)")
      .in("student_id", studentIds)
      .eq("attempts.class_id", classId);
    if (error) throw error;

    return ((data ?? []) as AttemptGameResultQueryRow[])
      .map((row) => {
        const attempt = Array.isArray(row.attempts) ? row.attempts[0] : row.attempts;
        if (!attempt) return null;
        return {
          attemptId: row.attempt_id,
          studentId: row.student_id,
          attemptStudentId: attempt.student_id,
          gameId: row.game_id,
          score: row.score,
          maxScore: row.max_score,
          completedAt: row.completed_at,
        };
      })
      .filter((row): row is DetailedGameResultRow => row !== null);
  },
};

function toGameScores(rows: DetailedGameResultRow[]) {
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
      scorePct: row.maxScore > 0
        ? Math.round((row.score / row.maxScore) * 100)
        : 0,
      completedAt: row.completedAt,
    }));
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

      const students = await deps.listRosterStudents(classroom.id);
      const studentIds = students.map((student) => student.id);
      const [assignments, attempts, detailedRows] = await Promise.all([
        deps.listAssignments(classroom.id, studentIds),
        deps.listCompletedAttempts(studentIds, classroom.id),
        deps.listDetailedGameResults(studentIds, classroom.id),
      ]);

      const validDetailedRows = detailedRows.filter((row) => row.studentId === row.attemptStudentId);
      const attemptsById = new Map(attempts.map((attempt) => [attempt.attemptId, attempt]));
      const completedDetailedRows = validDetailedRows.filter(
        (row) => attemptsById.get(row.attemptId)?.status === "completed",
      );
      const rowsByStudentId = new Map<string, DetailedGameResultRow[]>();
      for (const row of completedDetailedRows) {
        const existing = rowsByStudentId.get(row.studentId) ?? [];
        existing.push(row);
        rowsByStudentId.set(row.studentId, existing);
      }

      const latestAttemptByStudentId = new Map<string, AttemptRow>();
      for (const row of attempts) {
        if (row.status !== "completed" || !row.completedAt) continue;
        const current = latestAttemptByStudentId.get(row.studentId);
        if (!current || row.completedAt > (current.completedAt ?? "")) {
          latestAttemptByStudentId.set(row.studentId, row);
        }
      }

      const assignmentsByStudentId = new Map<string, AssignmentRow[]>();
      for (const student of students) {
        assignmentsByStudentId.set(
          student.id,
          assignments.filter((assignment) =>
            assignment.classId === classroom.id || assignment.studentId === student.id
          ),
        );
      }

      return jsonResponse({
        students: students.map((student) => {
          const ownRows = rowsByStudentId.get(student.id) ?? [];
          const latestAttempt = latestAttemptByStudentId.get(student.id) ?? null;
          const assignmentScores = (assignmentsByStudentId.get(student.id) ?? [])
            .map((assignment) => {
            const assignmentAttempts = attempts
              .filter((attempt) =>
                attempt.studentId === student.id && attempt.assignmentId === assignment.id
              )
              .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
            const attempt = assignmentAttempts[0] ?? null;
            const assignmentRows = attempt
              ? validDetailedRows.filter((row) => row.attemptId === attempt.attemptId)
              : [];
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
              gameScores: toGameScores(assignmentRows),
            };
            })
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

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
            assignments: assignmentScores,
          };
        }),
      });
    } catch (error) {
      console.error("classes-roster failed", error);
      return errorResponse("We couldn't load that class roster right now.", 500);
    }
  };
}
