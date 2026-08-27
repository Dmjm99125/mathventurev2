import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import { isPassingPct } from "../../../src/lib/teacher/progress.ts";

export type AssignmentQuizStatus = "in_progress" | "completed";

export type AssignmentQuizGameResult = {
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  completedAt?: string;
};

export type AssignmentQuizAttempt = {
  id: string;
  studentId: string;
  assignmentId: string;
  lessonId: string;
  status: AssignmentQuizStatus;
  quizMode: boolean;
  currentGameOrder: number;
  score: number;
  maxScore: number;
  durationSeconds: number | null;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type AssignmentQuizState = {
  status: "not_started" | AssignmentQuizStatus;
  assignmentId: string;
  lessonId: string;
  attemptId: string | null;
  currentGameOrder: number;
  score: number;
  maxScore: number;
  gameResults: AssignmentQuizGameResult[];
  completedAt: string | null;
};

type AssignmentContext = {
  lessonId: string;
  classId: string | null;
  studentId: string | null;
};

type CreateAttemptInput = {
  studentId: string;
  assignmentId: string;
  lessonId: string;
  classId: string | null;
};

type UpdateAttemptInput = Partial<Pick<
  AssignmentQuizAttempt,
  "status" | "currentGameOrder" | "score" | "maxScore" | "durationSeconds" | "completedAt" | "updatedAt"
>>;

type UpsertGameResultInput = AssignmentQuizGameResult & {
  attemptId: string;
  studentId: string;
};

export type AssignmentQuizDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getAssignmentContext(assignmentId: string): Promise<AssignmentContext | null>;
  isStudentEnrolledInClass(studentId: string, classId: string): Promise<boolean>;
  getAttempt(studentId: string, assignmentId: string): Promise<AssignmentQuizAttempt | null>;
  createAttempt(input: CreateAttemptInput): Promise<AssignmentQuizAttempt>;
  updateAttempt(studentId: string, attemptId: string, input: UpdateAttemptInput): Promise<AssignmentQuizAttempt>;
  listGameResults(attemptId: string): Promise<AssignmentQuizGameResult[]>;
  upsertGameResult(input: UpsertGameResultInput): Promise<void>;
};

export class AssignmentQuizHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "AssignmentQuizHttpError";
  }
}

const defaultDeps: AssignmentQuizDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getAssignmentContext(assignmentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("assignments")
      .select("lesson_id, class_id, student_id")
      .eq("id", assignmentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      lessonId: data.lesson_id,
      classId: data.class_id ?? null,
      studentId: data.student_id ?? null,
    };
  },
  async isStudentEnrolledInClass(studentId, classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select("class_id")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },
  async getAttempt(studentId, assignmentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .select("id, student_id, assignment_id, lesson_id, status, quiz_mode, current_game_order, score, max_score, duration_seconds, started_at, updated_at, completed_at")
      .eq("student_id", studentId)
      .eq("assignment_id", assignmentId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapAttempt(data);
  },
  async createAttempt(input) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .insert({
        student_id: input.studentId,
        assignment_id: input.assignmentId,
        lesson_id: input.lessonId,
        class_id: input.classId,
        status: "in_progress",
        quiz_mode: true,
        current_game_order: 0,
        score: 0,
        max_score: 0,
        duration_seconds: null,
      })
      .select("id, student_id, assignment_id, lesson_id, status, quiz_mode, current_game_order, score, max_score, duration_seconds, started_at, updated_at, completed_at")
      .single();
    if (error || !data) throw error ?? new Error("Failed to start assignment quiz");
    return mapAttempt(data);
  },
  async updateAttempt(studentId, attemptId, input) {
    const { adminClient } = await import("../_shared/client.ts");
    const update: Record<string, unknown> = {};
    if (input.status !== undefined) update.status = input.status;
    if (input.currentGameOrder !== undefined) update.current_game_order = input.currentGameOrder;
    if (input.score !== undefined) update.score = input.score;
    if (input.maxScore !== undefined) update.max_score = input.maxScore;
    if (input.durationSeconds !== undefined) update.duration_seconds = input.durationSeconds;
    if (input.completedAt !== undefined) update.completed_at = input.completedAt;
    if (input.updatedAt !== undefined) update.updated_at = input.updatedAt;

    const { data, error } = await adminClient
      .from("attempts")
      .update(update)
      .eq("id", attemptId)
      .eq("student_id", studentId)
      .select("id, student_id, assignment_id, lesson_id, status, quiz_mode, current_game_order, score, max_score, duration_seconds, started_at, updated_at, completed_at")
      .single();
    if (error || !data) throw error ?? new Error("Failed to update assignment quiz");
    return mapAttempt(data);
  },
  async listGameResults(attemptId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempt_game_results")
      .select("topic_id, game_id, game_order, score, max_score, completed_at")
      .eq("attempt_id", attemptId)
      .order("game_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      topicId: row.topic_id,
      gameId: row.game_id,
      gameOrder: row.game_order,
      score: row.score,
      maxScore: row.max_score,
      completedAt: row.completed_at,
    }));
  },
  async upsertGameResult(input) {
    const { adminClient } = await import("../_shared/client.ts");
    const { error } = await adminClient
      .from("attempt_game_results")
      .upsert({
        attempt_id: input.attemptId,
        student_id: input.studentId,
        topic_id: input.topicId,
        game_id: input.gameId,
        game_order: input.gameOrder,
        score: input.score,
        max_score: input.maxScore,
        score_pct: Math.round((input.score / input.maxScore) * 100),
        passed: isPassingPct(input.score, input.maxScore),
        completed_at: input.completedAt ?? new Date().toISOString(),
      }, { onConflict: "attempt_id,game_id" });
    if (error) throw error;
  },
};

function mapAttempt(row: any): AssignmentQuizAttempt {
  return {
    id: row.id,
    studentId: row.student_id,
    assignmentId: row.assignment_id,
    lessonId: row.lesson_id,
    status: row.status,
    quizMode: row.quiz_mode,
    currentGameOrder: row.current_game_order,
    score: row.score,
    maxScore: row.max_score,
    durationSeconds: row.duration_seconds ?? null,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null,
  };
}

function stateFromAttempt(
  assignmentId: string,
  lessonId: string,
  attempt: AssignmentQuizAttempt | null,
  gameResults: AssignmentQuizGameResult[],
): AssignmentQuizState {
  return {
    status: attempt?.status ?? "not_started",
    assignmentId,
    lessonId,
    attemptId: attempt?.id ?? null,
    currentGameOrder: attempt?.currentGameOrder ?? 0,
    score: attempt?.score ?? 0,
    maxScore: attempt?.maxScore ?? 0,
    gameResults,
    completedAt: attempt?.completedAt ?? null,
  };
}

function readAssignmentParams(req: Request, body?: any) {
  const url = new URL(req.url);
  const assignmentId = body?.assignmentId ?? url.searchParams.get("assignmentId");
  const lessonId = body?.lessonId ?? url.searchParams.get("lessonId");
  if (!assignmentId) throw new AssignmentQuizHttpError(422, "assignmentId is required");
  if (!lessonId) throw new AssignmentQuizHttpError(422, "lessonId is required");
  return { assignmentId, lessonId };
}

async function authorize(
  profile: AuthedProfile,
  assignmentId: string,
  lessonId: string,
  deps: AssignmentQuizDeps,
) {
  const assignment = await deps.getAssignmentContext(assignmentId);
  if (!assignment) throw new AssignmentQuizHttpError(404, "Assignment not found");
  if (assignment.lessonId !== lessonId) {
    throw new AssignmentQuizHttpError(422, "lessonId does not match the assignment");
  }
  if (assignment.studentId && assignment.studentId !== profile.id) {
    throw new AssignmentQuizHttpError(403, "That assignment is not available to this student");
  }
  if (assignment.classId && !(await deps.isStudentEnrolledInClass(profile.id, assignment.classId))) {
    throw new AssignmentQuizHttpError(403, "That assignment is not available to this student");
  }
  return assignment;
}

function parseGameResult(value: unknown, lessonId: string): AssignmentQuizGameResult {
  if (typeof value !== "object" || value === null) {
    throw new AssignmentQuizHttpError(422, "gameResult is required");
  }
  const result = value as AssignmentQuizGameResult;
  if (
    result.topicId !== lessonId
    || typeof result.gameId !== "string"
    || !result.gameId
    || !Number.isInteger(result.gameOrder)
    || result.gameOrder < 0
    || !Number.isFinite(result.score)
    || !Number.isFinite(result.maxScore)
    || result.maxScore <= 0
    || result.score < 0
    || result.score > result.maxScore
  ) {
    throw new AssignmentQuizHttpError(422, "gameResult is invalid");
  }
  return result;
}

function parseScore(value: unknown, name: string) {
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0) {
    throw new AssignmentQuizHttpError(422, `${name} must be a valid number`);
  }
  return score;
}

export function createAssignmentQuizHandler(deps: AssignmentQuizDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "GET" && req.method !== "POST") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "student") return errorResponse("Only students can use assignment quizzes", 403);

      const body = req.method === "POST" ? await req.json().catch(() => null) : null;
      const { assignmentId, lessonId } = readAssignmentParams(req, body);
      const assignment = await authorize(profile, assignmentId, lessonId, deps);
      const attempt = await deps.getAttempt(profile.id, assignmentId);
      const existingResults = attempt ? await deps.listGameResults(attempt.id) : [];

      if (req.method === "GET") {
        return jsonResponse({ state: stateFromAttempt(assignmentId, lessonId, attempt, existingResults) });
      }

      const action = body?.action;
      if (action === "start") {
        if (attempt) {
          return jsonResponse({ state: stateFromAttempt(assignmentId, lessonId, attempt, existingResults) });
        }
        try {
          const created = await deps.createAttempt({
            studentId: profile.id,
            assignmentId,
            lessonId,
            classId: assignment.classId,
          });
          return jsonResponse({ state: stateFromAttempt(assignmentId, lessonId, created, []) }, 201);
        } catch (error) {
          const concurrentAttempt = await deps.getAttempt(profile.id, assignmentId);
          if (concurrentAttempt) {
            const concurrentResults = await deps.listGameResults(concurrentAttempt.id);
            return jsonResponse({
              state: stateFromAttempt(assignmentId, lessonId, concurrentAttempt, concurrentResults),
            });
          }
          throw error;
        }
      }

      if (!attempt) throw new AssignmentQuizHttpError(409, "Start the assignment quiz before submitting progress");
      if (attempt.status === "completed") {
        return jsonResponse({ state: stateFromAttempt(assignmentId, lessonId, attempt, existingResults) });
      }

      if (action === "checkpoint") {
        const result = parseGameResult(body?.gameResult, lessonId);
        if (result.gameOrder < attempt.currentGameOrder) {
          const wasSaved = existingResults.some((row) => row.gameId === result.gameId && row.gameOrder === result.gameOrder);
          if (wasSaved) {
            return jsonResponse({ state: stateFromAttempt(assignmentId, lessonId, attempt, existingResults) });
          }
        }
        if (result.gameOrder !== attempt.currentGameOrder) {
          throw new AssignmentQuizHttpError(409, "Checkpoint is out of order");
        }
        const score = parseScore(body?.score, "score");
        await deps.upsertGameResult({ ...result, attemptId: attempt.id, studentId: profile.id });
        const updated = await deps.updateAttempt(profile.id, attempt.id, {
          currentGameOrder: result.gameOrder + 1,
          score,
        });
        const results = await deps.listGameResults(attempt.id);
        return jsonResponse({ state: stateFromAttempt(assignmentId, lessonId, updated, results) });
      }

      if (action === "complete") {
        const score = parseScore(body?.score, "score");
        const maxScore = parseScore(body?.maxScore, "maxScore");
        if (maxScore <= 0 || score > maxScore) {
          throw new AssignmentQuizHttpError(422, "score and maxScore must be valid numbers");
        }
        const submittedResults = Array.isArray(body?.gameResults) ? body.gameResults : [];
        for (const value of submittedResults) {
          const result = parseGameResult(value, lessonId);
          await deps.upsertGameResult({ ...result, attemptId: attempt.id, studentId: profile.id });
        }
        const nextOrder = submittedResults.reduce((highest: number, value: AssignmentQuizGameResult) => {
          return Math.max(highest, value.gameOrder + 1);
        }, attempt.currentGameOrder);
        const completedAt = new Date().toISOString();
        const updated = await deps.updateAttempt(profile.id, attempt.id, {
          status: "completed",
          currentGameOrder: nextOrder,
          score,
          maxScore,
          durationSeconds: body?.durationSeconds == null ? null : parseScore(body.durationSeconds, "durationSeconds"),
          completedAt,
        });
        const results = await deps.listGameResults(attempt.id);
        return jsonResponse({ state: stateFromAttempt(assignmentId, lessonId, updated, results) });
      }

      throw new AssignmentQuizHttpError(422, "action must be start, checkpoint, or complete");
    } catch (error) {
      if (error instanceof AssignmentQuizHttpError) return errorResponse(error.message, error.status);
      console.error("assignment-quiz failed", error);
      return errorResponse("We couldn't save that quiz right now.", 500);
    }
  };
}
