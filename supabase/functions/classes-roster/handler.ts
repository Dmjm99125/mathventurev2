import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import { GAME_CATALOG } from "../../../src/lib/games/catalog.ts";
import {
  calculateDetailedCompletionPct,
  calculateDetailedLastPlayedPct,
} from "../../../src/lib/teacher/progress.ts";

type RosterStudentRow = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  joinedAt: string;
};

type DetailedGameResultRow = {
  studentId: string;
  gameId: string;
  score: number;
  maxScore: number;
  completedAt: string;
};

type ClassesRosterDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  findOwnedClass(classId: string): Promise<{ id: string; teacherId: string } | null>;
  listRosterStudents(classId: string): Promise<RosterStudentRow[]>;
  listDetailedGameResults(studentIds: string[]): Promise<DetailedGameResultRow[]>;
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
};

const defaultDeps: ClassesRosterDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async findOwnedClass(classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id")
      .eq("id", classId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }

    return { id: data.id as string, teacherId: data.teacher_id as string };
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
  async listDetailedGameResults(studentIds) {
    if (!studentIds.length) {
      return [];
    }

    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempt_game_results")
      .select("student_id, game_id, score, max_score, completed_at")
      .in("student_id", studentIds);

    if (error) {
      throw error;
    }

    return ((data ?? []) as AttemptGameResultQueryRow[]).map((row) => ({
      studentId: row.student_id,
      gameId: row.game_id,
      score: row.score,
      maxScore: row.max_score,
      completedAt: row.completed_at,
    }));
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

      const classId = new URL(req.url).searchParams.get("classId");
      if (!classId) {
        return errorResponse("classId is required", 422);
      }

      const klass = await deps.findOwnedClass(classId);
      if (!klass) {
        return errorResponse("Class not found", 404);
      }
      if (klass.teacherId !== profile.id) {
        return errorResponse("Forbidden", 403);
      }

      const students = await deps.listRosterStudents(classId);
      const detailedRows = await deps.listDetailedGameResults(
        students.map((student) => student.id),
      );

      const rowsByStudentId = new Map<string, DetailedGameResultRow[]>();
      for (const row of detailedRows) {
        const existing = rowsByStudentId.get(row.studentId) ?? [];
        existing.push(row);
        rowsByStudentId.set(row.studentId, existing);
      }

      return jsonResponse({
        students: students.map((student) => {
          const ownRows = rowsByStudentId.get(student.id) ?? [];
          return {
            ...student,
            appCompletionPct: calculateDetailedCompletionPct(ownRows, GAME_CATALOG.length),
            lastPlayedPct: calculateDetailedLastPlayedPct(ownRows),
          };
        }),
      });
    } catch (error) {
      console.error("classes-roster failed", error);
      return errorResponse("We couldn't load that class roster right now.", 500);
    }
  };
}
