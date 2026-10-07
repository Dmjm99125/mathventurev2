import type { OfflineRepository } from './repository.ts';

type OfflineRow = Record<string, unknown>;

function text(row: OfflineRow, snake: string, camel: string): string {
  return typeof row[snake] === 'string' ? row[snake] as string : String(row[camel] ?? '');
}

function numberValue(row: OfflineRow, snake: string, camel: string): number {
  const value = row[snake] ?? row[camel];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function buildOfflineStudentDashboard(attempts: OfflineRow[]) {
  const completed = attempts.filter((attempt) => attempt.status === 'completed');
  const recentAttempts = [...completed]
    .sort((left, right) => text(right, 'completed_at', 'completedAt').localeCompare(text(left, 'completed_at', 'completedAt')))
    .slice(0, 10)
    .map((attempt) => ({
      lessonId: text(attempt, 'lesson_id', 'lessonId'),
      score: numberValue(attempt, 'score', 'score'),
      maxScore: numberValue(attempt, 'max_score', 'maxScore'),
      completedAt: text(attempt, 'completed_at', 'completedAt'),
    }));
  return {
    completedLessons: new Set(completed.map((attempt) => text(attempt, 'lesson_id', 'lessonId'))).size,
    streakDays: 0,
    recentAttempts,
  };
}

export function buildOfflineTeacherDashboard(
  classrooms: OfflineRow[],
  students: OfflineRow[],
  attempts: OfflineRow[],
) {
  const byClass = classrooms.map((classroom) => {
    const id = text(classroom, 'id', 'id');
    const classAttempts = attempts.filter((attempt) => text(attempt, 'class_id', 'classId') === id);
    const scored = classAttempts.filter((attempt) => numberValue(attempt, 'max_score', 'maxScore') > 0);
    return {
      id,
      name: text(classroom, 'name', 'name'),
      studentCount: students.filter((student) => text(student, 'class_id', 'classId') === id).length,
      attemptCount: classAttempts.length,
      averageScorePct: scored.length
        ? Math.round(scored.reduce((sum, attempt) => sum + numberValue(attempt, 'score', 'score') / numberValue(attempt, 'max_score', 'maxScore') * 100, 0) / scored.length)
        : null,
    };
  });
  return {
    classCount: classrooms.length,
    studentCount: students.length,
    classes: byClass,
    strugglingLessons: [],
  };
}

export async function readOfflinePosts(repository: OfflineRepository, classId: string) {
  const posts = await repository.readCollection('posts');
  return posts
    .filter((post) => text(post, 'class_id', 'classId') === classId)
    .sort((left, right) => text(left, 'created_at', 'createdAt').localeCompare(text(right, 'created_at', 'createdAt')))
    .map((post) => ({
      id: text(post, 'id', 'id'),
      classId,
      content: text(post, 'content', 'content'),
      createdAt: text(post, 'created_at', 'createdAt'),
      authorName: text(post, 'author_name', 'authorName') || 'Teacher',
    }));
}
