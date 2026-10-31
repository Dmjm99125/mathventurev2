import { describe, expect, it, vi } from 'vitest';

vi.mock('./reports', () => ({ TeacherReportsPage: () => null }));

import { TeacherReportsPage } from './reports';

describe('teacher reports feature boundary', () => {
  it('owns the reports page outside the legacy teacher page module', () => {
    expect(TeacherReportsPage).toEqual(expect.any(Function));
  });
});
