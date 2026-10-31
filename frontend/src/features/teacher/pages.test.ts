import { describe, expect, it, vi } from 'vitest';

vi.mock('@/pages/teacher', () => ({
  TeacherAssignmentsPage: () => null,
  TeacherClassesPage: () => null,
  TeacherClassWorkspacePage: () => null,
  TeacherReportsPage: () => null,
  TeacherSettingsPage: () => null,
  TeacherStudentsPage: () => null,
  TeacherTodayPage: () => null,
}));

import {
  TeacherAssignmentsPage,
  TeacherClassesPage,
  TeacherClassWorkspacePage,
  TeacherReportsPage,
  TeacherSettingsPage,
  TeacherStudentsPage,
  TeacherTodayPage,
} from './pages';

describe('teacher workspace page boundary', () => {
  it('exposes the existing workspace page contract', () => {
    expect([
      TeacherAssignmentsPage,
      TeacherClassesPage,
      TeacherClassWorkspacePage,
      TeacherReportsPage,
      TeacherSettingsPage,
      TeacherStudentsPage,
      TeacherTodayPage,
    ]).toEqual(Array(7).fill(expect.any(Function)));
  });
});
