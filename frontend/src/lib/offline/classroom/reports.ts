import type { OfflineRepository } from './repository.ts';
import {
  buildTeacherReportsOverview,
  buildTeacherSingleClassroomReport,
  type TeacherReportsOverviewPayload,
  type TeacherReportsWindowKey,
  type TeacherSingleClassroomReportPayload,
} from '../../teacher/reports/index.ts';

type OfflineRow = Record<string, unknown>;

function text(row: OfflineRow, snake: string, camel: string): string {
  return typeof row[snake] === 'string' ? row[snake] as string : String(row[camel] ?? '');
}

function numberValue(row: OfflineRow, snake: string, camel: string): number {
  const value = row[snake] ?? row[camel];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toNameParts(row: OfflineRow): { fullName: string; firstName: string; lastName: string | null } {
  const profile = row.profiles && typeof row.profiles === 'object' ? row.profiles as OfflineRow : row;
  const fullName = text(profile, 'full_name', 'fullName') || 'Student';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    fullName,
    firstName: parts[0] ?? 'Student',
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

function reportInputs(
  classrooms: OfflineRow[],
  students: OfflineRow[],
  gameResults: OfflineRow[],
) {
  const fallbackClassId = text(classrooms[0] ?? {}, 'id', 'id');
  return {
    classes: classrooms.map((classroom) => ({
      id: text(classroom, 'id', 'id'),
      name: text(classroom, 'name', 'name') || 'Classroom',
      joinCode: text(classroom, 'join_code', 'joinCode'),
      studentCount: students.filter((student) => text(student, 'class_id', 'classId') === text(classroom, 'id', 'id')).length,
    })),
    students: students.map((student) => {
      const name = toNameParts(student);
      return {
        id: text(student, 'student_id', 'studentId') || text(student, 'id', 'id'),
        classId: text(student, 'class_id', 'classId') || fallbackClassId,
        className: text(classrooms[0] ?? {}, 'name', 'name') || 'Classroom',
        ...name,
        joinedAt: text(student, 'joined_at', 'joinedAt'),
      };
    }),
    results: gameResults.map((result) => ({
      studentId: text(result, 'student_id', 'studentId'),
      classId: text(result, 'class_id', 'classId') || fallbackClassId,
      topicId: text(result, 'topic_id', 'topicId'),
      gameId: text(result, 'game_id', 'gameId'),
      gameOrder: numberValue(result, 'game_order', 'gameOrder'),
      score: numberValue(result, 'score', 'score'),
      maxScore: numberValue(result, 'max_score', 'maxScore'),
      scorePct: numberValue(result, 'score_pct', 'scorePct'),
      passed: result.passed === true,
      completedAt: text(result, 'completed_at', 'completedAt'),
    })),
  };
}

export function buildOfflineTeacherReportsOverview(
  classrooms: OfflineRow[],
  students: OfflineRow[],
  gameResults: OfflineRow[],
  windowKey: TeacherReportsWindowKey,
): TeacherReportsOverviewPayload {
  return buildTeacherReportsOverview({ ...reportInputs(classrooms, students, gameResults), windowKey });
}

export function buildOfflineTeacherClassReport(
  classrooms: OfflineRow[],
  students: OfflineRow[],
  gameResults: OfflineRow[],
  classId: string,
  windowKey: TeacherReportsWindowKey,
): TeacherSingleClassroomReportPayload {
  const inputs = reportInputs(classrooms, students, gameResults);
  const classroom = inputs.classes.find((row) => row.id === classId) ?? inputs.classes[0];
  if (!classroom) throw new Error('Classroom unavailable offline.');
  return buildTeacherSingleClassroomReport({
    classroom: { id: classroom.id, studentCount: classroom.studentCount },
    students: inputs.students,
    results: inputs.results,
    windowKey,
  });
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
