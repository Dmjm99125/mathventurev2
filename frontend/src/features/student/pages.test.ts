import { describe, expect, it, vi } from 'vitest';

vi.mock('./classroom', () => ({
  StudentClassroomPage: () => null,
}));
vi.mock('./dashboard', () => ({
  StudentDashboard: () => null,
}));

import { StudentClassroomPage, StudentDashboard } from './pages';

describe('student page boundary', () => {
  it('exposes the existing student page contract', () => {
    expect([StudentClassroomPage, StudentDashboard])
      .toEqual([expect.any(Function), expect.any(Function)]);
  });
});
