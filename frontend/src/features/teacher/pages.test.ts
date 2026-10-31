import { describe, expect, it, vi } from 'vitest';

vi.mock('./settings', () => ({ TeacherSettingsPage: () => null }));
vi.mock('./classes', () => ({ TeacherClassesPage: () => null }));
vi.mock('./assignments', () => ({ TeacherAssignmentsPage: () => null }));
vi.mock('./reports', () => ({ TeacherReportsPage: () => null }));
vi.mock('./today', () => ({ TeacherTodayPage: () => null }));
vi.mock('./students', () => ({ TeacherStudentsPage: () => null }));
vi.mock('./workspace', () => ({ TeacherClassWorkspacePage: () => null }));

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
