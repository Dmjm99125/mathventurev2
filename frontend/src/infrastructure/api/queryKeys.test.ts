import { describe, expect, it } from 'vitest';
import {
  assignmentKeys,
  classroomKeys,
  dashboardKeys,
  postKeys,
  reportKeys,
} from './queryKeys';

describe('server-state query key contracts', () => {
  it('preserves classroom key identities', () => {
    expect(classroomKeys.all()).toEqual(['classes']);
    expect(classroomKeys.classesRoster('class-1')).toEqual(['classes', 'class-1', 'roster']);
    expect(classroomKeys.teacher()).toEqual(['classroom', 'teacher']);
    expect(classroomKeys.teacher(null)).toEqual(['classroom', 'teacher', null]);
    expect(classroomKeys.student()).toEqual(['classroom', 'student']);
    expect(classroomKeys.roster()).toEqual(['classroom', 'roster']);
    expect(classroomKeys.roster(null)).toEqual(['classroom', 'roster', null]);
    expect(classroomKeys.roster('class-1')).toEqual(['classroom', 'roster', 'class-1']);
    expect(classroomKeys.rosterStudent('class-1', 'student-1')).toEqual([
      'classroom', 'roster', 'class-1', 'student', 'student-1',
    ]);
  });

  it('preserves assignment and dashboard key identities', () => {
    expect(assignmentKeys.all()).toEqual(['assignments']);
    expect(assignmentKeys.list()).toEqual(['assignments', undefined]);
    expect(assignmentKeys.list('class-1')).toEqual(['assignments', 'class-1']);
    expect(assignmentKeys.quiz('assignment-1', 'colors')).toEqual(['assignment-quiz', 'assignment-1', 'colors']);
    expect(dashboardKeys.student()).toEqual(['dashboard', 'student']);
    expect(dashboardKeys.teacher()).toEqual(['dashboard', 'teacher']);
  });

  it('preserves report and post key identities', () => {
    expect(reportKeys.overview('class-1', '30d', null)).toEqual([
      'teacher-reports', 'overview', 'class-1', '30d', null,
    ]);
    expect(reportKeys.class('class-1', '7d', 'next')).toEqual([
      'teacher-reports', 'class', 'class-1', '7d', 'next',
    ]);
    expect(postKeys.list('class-1')).toEqual(['posts', 'class-1']);
  });
});
