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
    expect(classroomKeys.all()).toEqual(['classroom']);
    expect(classroomKeys.teacher()).toEqual(['classroom', 'teacher']);
    expect(classroomKeys.student()).toEqual(['classroom', 'student']);
    expect(classroomKeys.roster()).toEqual(['classroom', 'roster', 'singleton']);
    expect(classroomKeys.roster('class-1')).toEqual(['classroom', 'roster', 'class-1']);
  });

  it('preserves assignment and dashboard key identities', () => {
    expect(assignmentKeys.list()).toEqual(['assignments', undefined]);
    expect(assignmentKeys.list('class-1')).toEqual(['assignments', 'class-1']);
    expect(assignmentKeys.quiz('assignment-1', 'colors')).toEqual(['assignment-quiz', 'assignment-1', 'colors']);
    expect(dashboardKeys.student()).toEqual(['dashboard', 'student']);
    expect(dashboardKeys.teacher()).toEqual(['dashboard', 'teacher']);
  });

  it('preserves report and post key identities', () => {
    expect(reportKeys.overview('30d')).toEqual(['teacher-reports', 'overview', '30d']);
    expect(reportKeys.class('class-1', '7d')).toEqual(['teacher-reports', 'class', 'class-1', '7d']);
    expect(postKeys.list('class-1')).toEqual(['posts', 'class-1']);
  });
});
