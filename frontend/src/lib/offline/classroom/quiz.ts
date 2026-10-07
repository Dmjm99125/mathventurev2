import type { AttemptGameResultInput, AssignmentQuizState } from '../../api/client.ts';
import type { OfflineRepository } from './repository.ts';

type QuizStartResult = { attemptId: string; state: AssignmentQuizState };

function now(): string {
  return new Date().toISOString();
}

function stateFromAttempt(
  assignmentId: string,
  lessonId: string,
  attempt: Record<string, unknown>,
): AssignmentQuizState {
  return {
    status: attempt.status === 'completed' ? 'completed' : 'in_progress',
    assignmentId,
    lessonId,
    attemptId: String(attempt.id),
    currentGameOrder: typeof attempt.currentGameOrder === 'number' ? attempt.currentGameOrder : 0,
    score: typeof attempt.score === 'number' ? attempt.score : 0,
    maxScore: typeof attempt.maxScore === 'number' ? attempt.maxScore : 0,
    gameResults: Array.isArray(attempt.gameResults) ? attempt.gameResults as AttemptGameResultInput[] : [],
    completedAt: typeof attempt.completedAt === 'string' ? attempt.completedAt : null,
  };
}

async function dependenciesForAttempt(repository: OfflineRepository, attemptId: string): Promise<string[]> {
  const operations = await repository.getOutbox();
  return operations.filter((operation) => operation.entityId === attemptId).map((operation) => operation.operationId);
}

export async function startOfflineAssignmentQuiz(
  repository: OfflineRepository,
  studentId: string,
  assignmentId: string,
  lessonId: string,
  idFactory?: () => string,
): Promise<QuizStartResult> {
  const existing = (await repository.readCollection('attempts')).find((attempt) => {
    return attempt.assignment_id === assignmentId && attempt.student_id === studentId;
  });
  if (existing) return { attemptId: String(existing.id), state: stateFromAttempt(assignmentId, lessonId, existing) };
  const attemptId = idFactory?.() ?? crypto.randomUUID();
  const attempt = {
    id: attemptId,
    student_id: studentId,
    assignment_id: assignmentId,
    lesson_id: lessonId,
    status: 'in_progress',
    quiz_mode: true,
    currentGameOrder: 0,
    score: 0,
    maxScore: 0,
    gameResults: [],
    startedAt: now(),
    completedAt: null,
  };
  await repository.applyMutation({
    actorId: studentId,
    type: 'assignmentQuiz.start',
    entityId: attemptId,
    payload: { assignmentId, lessonId, ...attempt },
    dependencies: [],
  });
  return { attemptId, state: stateFromAttempt(assignmentId, lessonId, attempt) };
}

export async function readOfflineAssignmentQuiz(
  repository: OfflineRepository,
  studentId: string,
  assignmentId: string,
  lessonId: string,
): Promise<AssignmentQuizState> {
  const attempt = (await repository.readCollection('attempts')).find((candidate) => {
    return candidate.assignment_id === assignmentId && candidate.student_id === studentId;
  });
  if (!attempt) {
    return {
      status: 'not_started',
      assignmentId,
      lessonId,
      attemptId: null,
      currentGameOrder: 0,
      score: 0,
      maxScore: 0,
      gameResults: [],
      completedAt: null,
    };
  }
  return stateFromAttempt(assignmentId, lessonId, attempt);
}

export async function checkpointOfflineAssignmentQuiz(
  repository: OfflineRepository,
  studentId: string,
  input: {
    attemptId: string;
    assignmentId: string;
    lessonId: string;
    score: number;
    gameResult: AttemptGameResultInput;
  },
): Promise<AssignmentQuizState> {
  const current = await repository.readByKey('attempts', input.attemptId);
  if (!current) throw new Error('Start the assignment quiz before saving progress.');
  const currentOrder = typeof current.currentGameOrder === 'number' ? current.currentGameOrder : 0;
  if (input.gameResult.gameOrder < currentOrder) return stateFromAttempt(input.assignmentId, input.lessonId, current);
  if (input.gameResult.gameOrder !== currentOrder) throw new Error('Checkpoint is out of order.');
  const gameResults = Array.isArray(current.gameResults) ? current.gameResults as AttemptGameResultInput[] : [];
  const attempt = {
    ...current,
    id: input.attemptId,
    student_id: studentId,
    assignment_id: input.assignmentId,
    lesson_id: input.lessonId,
    status: 'in_progress',
    currentGameOrder: currentOrder + 1,
    score: input.score,
    gameResults: [...gameResults, input.gameResult],
  };
  await repository.applyMutation({
    actorId: studentId,
    type: 'assignmentQuiz.checkpoint',
    entityId: input.attemptId,
    payload: { assignmentId: input.assignmentId, lessonId: input.lessonId, ...attempt, gameResult: input.gameResult },
    dependencies: await dependenciesForAttempt(repository, input.attemptId),
  });
  return stateFromAttempt(input.assignmentId, input.lessonId, attempt);
}

export async function completeOfflineAssignmentQuiz(
  repository: OfflineRepository,
  studentId: string,
  input: {
    attemptId: string;
    assignmentId: string;
    lessonId: string;
    score: number;
    maxScore: number;
    durationSeconds?: number;
    gameResults: AttemptGameResultInput[];
  },
): Promise<AssignmentQuizState> {
  const current = await repository.readByKey('attempts', input.attemptId);
  if (!current) throw new Error('Start the assignment quiz before completing it.');
  const attempt = {
    ...current,
    id: input.attemptId,
    student_id: studentId,
    assignment_id: input.assignmentId,
    lesson_id: input.lessonId,
    status: 'completed',
    score: input.score,
    maxScore: input.maxScore,
    durationSeconds: input.durationSeconds ?? null,
    gameResults: input.gameResults,
    completedAt: now(),
  };
  await repository.applyMutation({
    actorId: studentId,
    type: 'assignmentQuiz.complete',
    entityId: input.attemptId,
    payload: { assignmentId: input.assignmentId, lessonId: input.lessonId, ...attempt },
    dependencies: await dependenciesForAttempt(repository, input.attemptId),
  });
  return stateFromAttempt(input.assignmentId, input.lessonId, attempt);
}

export async function submitOfflineAttempt(
  repository: OfflineRepository,
  studentId: string,
  input: {
    lessonId: string;
    classId?: string;
    score: number;
    maxScore: number;
    durationSeconds?: number;
    gameResults?: AttemptGameResultInput[];
  },
  idFactory?: () => string,
) {
  const attemptId = idFactory?.() ?? crypto.randomUUID();
  await repository.applyMutation({
    actorId: studentId,
    type: 'attempt.submit',
    entityId: attemptId,
    payload: { id: attemptId, ...input },
    dependencies: [],
  });
  return { id: attemptId, syncState: 'pending' as const };
}
