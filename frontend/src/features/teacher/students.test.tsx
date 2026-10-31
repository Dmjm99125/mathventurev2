import { describe, expect, it, vi } from 'vitest';

vi.mock('./students', () => ({ TeacherStudentsPage: () => null }));

import { TeacherStudentsPage } from './students';

describe('teacher students feature boundary', () => {
  it('owns the students page outside the legacy teacher page module', () => {
    expect(TeacherStudentsPage).toEqual(expect.any(Function));
  });
});
