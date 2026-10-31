import { describe, expect, it } from 'vitest';
import type { AssignmentForTeacher, TeacherClassStudent } from '@/lib/api/client';
import { buildTeacherAssignedQuizzes, getTeacherAssignedQuizName } from './assignments';

const students: TeacherClassStudent[] = [{
  id: 'student-1',
  fullName: 'Ada Lovelace',
  firstName: 'Ada',
  lastName: 'Lovelace',
  joinedAt: '2026-08-01T00:00:00Z',
  appCompletionPct: 50,
  lastPlayedPct: 80,
  overallScore: 8,
  overallMaxScore: 10,
  overallScorePct: 80,
  gameScores: [],
  assignments: [{
    assignmentId: 'quiz-1',
    name: 'Addition Check',
    lessonId: 'addition',
    dueAt: null,
    createdAt: '2026-08-20T00:00:00Z',
    status: 'completed',
    overallScore: 8,
    overallMaxScore: 10,
    overallScorePct: 80,
    gameScores: [{ gameId: 'addition', score: 8, maxScore: 10, scorePct: 80, completedAt: '2026-08-21T00:00:00Z' }],
  }],
}, {
  id: 'student-2',
  fullName: 'Grace Hopper',
  firstName: 'Grace',
  lastName: 'Hopper',
  joinedAt: '2026-08-02T00:00:00Z',
  appCompletionPct: null,
  lastPlayedPct: null,
  overallScore: null,
  overallMaxScore: null,
  overallScorePct: null,
  gameScores: [],
  assignments: [],
}];

const assignment: AssignmentForTeacher = {
  id: 'quiz-1',
  name: 'Addition Check',
  lessonId: 'addition',
  classId: 'class-1',
  className: 'Room 1',
  studentId: null,
  dueAt: null,
  createdAt: '2026-08-20T00:00:00Z',
};

describe('teacher assignment view model', () => {
  it('joins assignment scores and defaults missing student scores to not started', () => {
    const [quiz] = buildTeacherAssignedQuizzes([assignment], students);

    expect(quiz.students.map((student) => student.id)).toEqual(['student-1', 'student-2']);
    expect(quiz.students[0].overallScorePct).toBe(80);
    expect(quiz.students[1].status).toBe('not_started');
    expect(quiz.students[1].gameScores).toEqual([]);
  });

  it('limits directly targeted assignments to the target student', () => {
    const targeted = { ...assignment, id: 'quiz-2', classId: null, studentId: 'student-2' };
    expect(buildTeacherAssignedQuizzes([targeted], students)[0].students.map((student) => student.id))
      .toEqual(['student-2']);
  });

  it('uses the lesson id when the custom assignment name is blank', () => {
    expect(getTeacherAssignedQuizName({ name: '  ', lessonId: 'addition' })).toBe('addition');
    expect(getTeacherAssignedQuizName({ name: 'My Quiz', lessonId: 'addition' })).toBe('My Quiz');
  });
});
