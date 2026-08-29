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

type DetailedGameResultRow = {
  studentId: string;
  attemptStudentId: string;
  gameId: string;
  score: number;
  maxScore: number;
  completedAt: string;
};

type CompletedAttemptRow = {
  studentId: string;
  score: number;
  maxScore: number;
  completedAt: string;
};

type ClassesRosterDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClassroom(
    teacherId: string,
  ): Promise<{ id: string; teacherId: string; name: string } | null>;
  listRosterStudents(classId: string): Promise<RosterStudentRow[]>;
  listCompletedAttempts(studentIds: string[], classId: string): Promise<CompletedAttemptRow[]>;
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

type AttemptGameResultQueryRow = {
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

    if (error) {
      throw error;
    }
    const classrooms = (data ?? []).map((row) => ({
      id: row.id as string,
      teacherId: row.teacher_id as string,
      name: row.name as string,
      createdAt: row.created_at as string,
    }));
    if (!classrooms.length) {
      return null;
    }

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

    if (error) {
      throw error;
    }

    return ((data ?? []) as unknown as ClassStudentQueryRow[])
      .map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        if (!profile) {
          return null;
        }

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
  async listCompletedAttempts(studentIds, classId) {
    if (!studentIds.length) {
      return [];
    }

    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .select("student_id, score, max_score, completed_at")
      .in("student_id", studentIds)
      .eq("class_id", classId)
      .eq("status", "completed");

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      studentId: row.student_id as string,
      score: row.score as number,
      maxScore: row.max_score as number,
      completedAt: row.completed_at as string,
    }));
  },
  async listDetailedGameResults(studentIds, classId) {
    if (!studentIds.length) {
      return [];
    }

    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempt_game_results")
      .select("student_id, game_id, score, max_score, completed_at, attempts!inner(status, class_id, student_id)")
      .in("student_id", studentIds)
      .eq("attempts.class_id", classId)
      .eq("attempts.status", "completed");

    if (error) {
      throw error;
    }

    return ((data ?? []) as AttemptGameResultQueryRow[])
      .map((row) => {
        const attempt = Array.isArray(row.attempts) ? row.attempts[0] : row.attempts;
        if (!attempt) {
          return null;
        }

        return {
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

export function createClassesRosterHandler(deps: ClassesRosterDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "GET") {
      return errorResponse("Method not allowed", 405);
    }

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) {
        return errorResponse("Unauthorized", 401);
      }
      if (profile.role !== "teacher") {
        return errorResponse("Only teachers can view rosters", 403);
      }

      const classroom = await deps.getTeacherClassroom(profile.id);
      if (!classroom) {
        return errorResponse("Classroom not found", 404);
      }

      const students = await deps.listRosterStudents(classroom.id);
      const detailedRows = (await deps.listDetailedGameResults(
        students.map((student) => student.id),
        classroom.id,
      )).filter((row) => row.studentId === row.attemptStudentId);
      const completedAttempts = await deps.listCompletedAttempts(
        students.map((student) => student.id),
        classroom.id,
      );

      const rowsByStudentId = new Map<string, DetailedGameResultRow[]>();
      for (const row of detailedRows) {
        const existing = rowsByStudentId.get(row.studentId) ?? [];
        existing.push(row);
        rowsByStudentId.set(row.studentId, existing);
      }

      const latestAttemptByStudentId = new Map<string, CompletedAttemptRow>();
      for (const row of completedAttempts) {
        const current = latestAttemptByStudentId.get(row.studentId);
        if (!current || row.completedAt > current.completedAt) {
          latestAttemptByStudentId.set(row.studentId, row);
        }
      }

      const latestGameByStudentId = new Map<string, Map<string, DetailedGameResultRow>>();
      for (const row of detailedRows) {
        const rowsByGameId = latestGameByStudentId.get(row.studentId) ?? new Map();
        const current = rowsByGameId.get(row.gameId);
        if (!current || row.completedAt > current.completedAt) {
          rowsByGameId.set(row.gameId, row);
        }
        latestGameByStudentId.set(row.studentId, rowsByGameId);
      }

      return jsonResponse({
        students: students.map((student) => {
          const ownRows = rowsByStudentId.get(student.id) ?? [];
          const latestAttempt = latestAttemptByStudentId.get(student.id) ?? null;
          const gameScores = Array.from(
            latestGameByStudentId.get(student.id)?.values() ?? [],
          )
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

          return {
            ...student,
            appCompletionPct: calculateDetailedCompletionPct(ownRows, GAME_CATALOG.length),
            lastPlayedPct: calculateDetailedLastPlayedPct(ownRows),
            overallScore: latestAttempt?.score ?? null,
            overallMaxScore: latestAttempt?.maxScore ?? null,
            overallScorePct: latestAttempt && latestAttempt.maxScore > 0
              ? Math.round((latestAttempt.score / latestAttempt.maxScore) * 100)
              : null,
            gameScores,
          };
        }),
      });
    } catch (error) {
      console.error("classes-roster failed", error);
      return errorResponse("We couldn't load that class roster right now.", 500);
    }
  };
}
