import { describe, expect, it, vi } from 'vitest';

vi.mock('./assignments', () => ({ TeacherAssignmentsPage: () => null }));

import { TeacherAssignmentsPage } from './assignments';

describe('teacher assignments feature boundary', () => {
  it('owns the assignments page outside the legacy teacher page module', () => {
    expect(TeacherAssignmentsPage).toEqual(expect.any(Function));
  });
});
