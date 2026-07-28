import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import { isPassingPct } from "../../../src/lib/teacher-progress.ts";

export type AttemptGameResultInput = {
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  completedAt?: string;
};

type AttemptInsertInput = {
  studentId: string;
  lessonId: string;
  assignmentId: string | null;
  score: number;
  maxScore: number;
  durationSeconds: number | null;
};

type AttemptGameResultInsert = {
  attemptId: string;
  studentId: string;
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  scorePct: number;
  passed: boolean;
  completedAt: string;
};

type AttemptsSubmitDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  insertAttempt(input: AttemptInsertInput): Promise<{
    id: string;
    lesson_id: string;
    score: number;
    max_score: number;
    completed_at: string;
  }>;
  insertAttemptGameResults(rows: AttemptGameResultInsert[]): Promise<void>;
};

const defaultDeps: AttemptsSubmitDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async insertAttempt(input) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .insert({
        student_id: input.studentId,
        lesson_id: input.lessonId,
        assignment_id: input.assignmentId,
        score: input.score,
        max_score: input.maxScore,
        duration_seconds: input.durationSeconds,
      })
      .select("id, lesson_id, score, max_score, completed_at")
      .single();

    if (error || !data) {
      throw error ?? new Error("Failed to insert attempt");
    }

    return data;
  },
  async insertAttemptGameResults(rows) {
    if (!rows.length) return;

    const { adminClient } = await import("../_shared/client.ts");
    const { error } = await adminClient.from("attempt_game_results").insert(
      rows.map((row) => ({
        attempt_id: row.attemptId,
        student_id: row.studentId,
        topic_id: row.topicId,
        game_id: row.gameId,
        game_order: row.gameOrder,
        score: row.score,
        max_score: row.maxScore,
        score_pct: row.scorePct,
        passed: row.passed,
        completed_at: row.completedAt,
      })),
    );

    if (error) {
      throw error;
    }
  },
};

function isAttemptGameResultInput(value: unknown): value is AttemptGameResultInput {
  return typeof value === "object"
    && value !== null
    && typeof (value as AttemptGameResultInput).topicId === "string"
    && typeof (value as AttemptGameResultInput).gameId === "string"
    && (value as AttemptGameResultInput).gameId.length > 0
    && Number.isInteger((value as AttemptGameResultInput).gameOrder)
    && Number.isFinite((value as AttemptGameResultInput).score)
    && Number.isFinite((value as AttemptGameResultInput).maxScore)
    && (value as AttemptGameResultInput).maxScore > 0;
}

export function createAttemptsSubmitHandler(deps: AttemptsSubmitDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "student") return errorResponse("Only students can submit attempts", 403);

      const body = await req.json().catch(() => null);
      const lessonId = body?.lessonId;
      const score = Number(body?.score);
      const maxScore = Number(body?.maxScore);
      const assignmentId = body?.assignmentId ?? null;
      const durationSeconds = body?.durationSeconds != null ? Number(body.durationSeconds) : null;
      const gameResults = Array.isArray(body?.gameResults) ? body.gameResults : [];

      if (!lessonId) return errorResponse("lessonId is required", 422);
      if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
        return errorResponse("score and maxScore must be valid numbers", 422);
      }
      if (!gameResults.every(isAttemptGameResultInput)) {
        return errorResponse("gameResults must contain valid detailed game rows", 422);
      }
      const detailedGameResults = gameResults as AttemptGameResultInput[];

      const attempt = await deps.insertAttempt({
        studentId: profile.id,
        lessonId,
        assignmentId,
        score,
        maxScore,
        durationSeconds,
      });

      await deps.insertAttemptGameResults(
        detailedGameResults.map((row) => ({
          attemptId: attempt.id,
          studentId: profile.id,
          topicId: row.topicId,
          gameId: row.gameId,
          gameOrder: row.gameOrder,
          score: row.score,
          maxScore: row.maxScore,
          scorePct: Math.round((row.score / row.maxScore) * 100),
          passed: isPassingPct(row.score, row.maxScore),
          completedAt: row.completedAt ?? attempt.completed_at,
        })),
      );

      return jsonResponse({ attempt }, 201);
    } catch (error) {
      console.error("attempts-submit failed", error);
      return errorResponse("We couldn't save that attempt right now.", 500);
    }
  };
}
