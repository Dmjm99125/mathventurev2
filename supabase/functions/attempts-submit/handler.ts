import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import { isPassingPct } from "../../../src/lib/teacher/progress.ts";

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
  classId: string | null;
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
  resolveAttemptClassId(input: ResolveAttemptClassIdInput): Promise<string | null>;
  insertAttempt(input: AttemptInsertInput): Promise<{
    id: string;
    lesson_id: string;
    score: number;
    max_score: number;
    completed_at: string;
  }>;
  insertAttemptGameResults(rows: AttemptGameResultInsert[]): Promise<void>;
};

type AssignmentContext = {
  classId: string | null;
  studentId: string | null;
};

type ResolveAttemptClassIdInput = {
  studentId: string;
  assignmentId: string | null;
  requestedClassId: string | null;
};

type ResolveAttemptClassIdDeps = {
  getAssignmentContext(assignmentId: string): Promise<AssignmentContext | null>;
  isStudentEnrolledInClass(studentId: string, classId: string): Promise<boolean>;
  getStudentSingletonClassId(studentId: string): Promise<string | null>;
};

class AttemptsSubmitHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AttemptsSubmitHttpError";
  }
}

const defaultResolveAttemptClassIdDeps: ResolveAttemptClassIdDeps = {
  async getAssignmentContext(assignmentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("assignments")
      .select("class_id, student_id")
      .eq("id", assignmentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      classId: data.class_id ?? null,
      studentId: data.student_id ?? null,
    };
  },
  async isStudentEnrolledInClass(studentId, classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select("class_id")
      .eq("class_id", classId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data);
  },
  async getStudentSingletonClassId(studentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select("class_id")
      .eq("student_id", studentId)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.class_id as string | null | undefined) ?? null;
  },
};

export async function resolveAttemptClassId(
  input: ResolveAttemptClassIdInput,
  deps: ResolveAttemptClassIdDeps = defaultResolveAttemptClassIdDeps,
): Promise<string | null> {
  if (input.assignmentId) {
    const assignment = await deps.getAssignmentContext(input.assignmentId);
    if (!assignment) {
      throw new AttemptsSubmitHttpError(404, "Assignment not found");
    }

    if (assignment.studentId && assignment.studentId !== input.studentId) {
      throw new AttemptsSubmitHttpError(
        403,
        "That assignment is not available to this student",
      );
    }

    if (!assignment.classId) {
      return null;
    }

    if (
      input.requestedClassId &&
      input.requestedClassId !== assignment.classId
    ) {
      throw new AttemptsSubmitHttpError(422, "classId does not match the assignment");
    }

    const isEnrolled = await deps.isStudentEnrolledInClass(
      input.studentId,
      assignment.classId,
    );
    if (!isEnrolled) {
      throw new AttemptsSubmitHttpError(
        403,
        "That assignment is not available to this student",
      );
    }

    return assignment.classId;
  }

  if (!input.requestedClassId) {
    return deps.getStudentSingletonClassId(input.studentId);
  }

  const isEnrolled = await deps.isStudentEnrolledInClass(
    input.studentId,
    input.requestedClassId,
  );
  if (!isEnrolled) {
    throw new AttemptsSubmitHttpError(403, "That class is not available to this student");
  }

  return input.requestedClassId;
}

const defaultDeps: AttemptsSubmitDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async resolveAttemptClassId(input) {
    return resolveAttemptClassId(input);
  },
  async insertAttempt(input) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .insert({
        student_id: input.studentId,
        lesson_id: input.lessonId,
        assignment_id: input.assignmentId,
        class_id: input.classId,
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
      const requestedClassId = typeof body?.classId === "string"
        ? body.classId
        : null;
      const durationSeconds = body?.durationSeconds != null ? Number(body.durationSeconds) : null;
      const gameResults = Array.isArray(body?.gameResults) ? body.gameResults : [];

      if (!lessonId) return errorResponse("lessonId is required", 422);
      if (assignmentId) {
        return errorResponse("Use the assignment quiz flow for assigned work", 409);
      }
      if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
        return errorResponse("score and maxScore must be valid numbers", 422);
      }
      if (!gameResults.every(isAttemptGameResultInput)) {
        return errorResponse("gameResults must contain valid detailed game rows", 422);
      }
      const detailedGameResults = gameResults as AttemptGameResultInput[];
      const classId = await deps.resolveAttemptClassId({
        studentId: profile.id,
        assignmentId,
        requestedClassId,
      });

      const attempt = await deps.insertAttempt({
        studentId: profile.id,
        lessonId,
        assignmentId,
        classId,
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
      if (error instanceof AttemptsSubmitHttpError) {
        return errorResponse(error.message, error.status);
      }
      console.error("attempts-submit failed", error);
      return errorResponse("We couldn't save that attempt right now.", 500);
    }
  };
}
