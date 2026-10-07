import type { OfflineRepository } from './repository.ts';

export type OfflineProfile = { id: string } | null;

export function isClassroomDataReady(input: {
  isLoading: boolean;
  user: unknown;
  offlineProfile: OfflineProfile;
}): boolean {
  return !input.isLoading && Boolean(input.user || input.offlineProfile);
}

export function buildOfflinePage<T>(items: T[]) {
  return {
    items,
    page: { nextCursor: null, hasMore: false },
  };
}

function stringValue(row: Record<string, unknown>, snake: string, camel: string): string {
  return typeof row[snake] === 'string' ? row[snake] as string : String(row[camel] ?? '');
}

function nullableStringValue(row: Record<string, unknown>, snake: string, camel: string): string | null {
  const value = row[snake] ?? row[camel];
  return typeof value === 'string' ? value : null;
}

export async function readOfflineAssignments(
  repository: OfflineRepository,
  studentId?: string,
) {
  const [assignments, attempts] = await Promise.all([
    repository.readCollection('assignments'),
    repository.readCollection('attempts'),
  ]);
  return assignments
    .filter((assignment) => {
      if (!studentId) return true;
      const targetStudent = nullableStringValue(assignment, 'student_id', 'studentId');
      return !targetStudent || targetStudent === studentId;
    })
    .map((assignment) => {
      const id = stringValue(assignment, 'id', 'id');
      const attempt = attempts.find((candidate) => {
        return stringValue(candidate, 'assignment_id', 'assignmentId') === id
          && (!studentId || stringValue(candidate, 'student_id', 'studentId') === studentId);
      });
      const status = attempt
        ? (attempt.status === 'completed' ? 'completed' : 'in_progress')
        : 'not_started';
      return {
        id,
        name: stringValue(assignment, 'name', 'name') || stringValue(assignment, 'lesson_id', 'lessonId'),
        lessonId: stringValue(assignment, 'lesson_id', 'lessonId'),
        classId: nullableStringValue(assignment, 'class_id', 'classId'),
        dueAt: nullableStringValue(assignment, 'due_at', 'dueAt'),
        createdAt: stringValue(assignment, 'created_at', 'createdAt'),
        status,
        currentGameOrder: typeof attempt?.current_game_order === 'number' ? attempt.current_game_order : 0,
        score: typeof attempt?.score === 'number' ? attempt.score : 0,
        maxScore: typeof attempt?.max_score === 'number' ? attempt.max_score : 0,
        completed: status === 'completed',
      };
    });
}
