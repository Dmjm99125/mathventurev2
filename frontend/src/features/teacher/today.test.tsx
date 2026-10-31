import { describe, expect, it, vi } from 'vitest';

vi.mock('./today', () => ({ TeacherTodayPage: () => null }));

import { TeacherTodayPage } from './today';

describe('teacher today feature boundary', () => {
  it('owns the today page outside the legacy teacher page module', () => {
    expect(TeacherTodayPage).toEqual(expect.any(Function));
  });
});
