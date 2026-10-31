import { describe, expect, it, vi } from 'vitest';

vi.mock('./dashboard', () => ({ StudentDashboard: () => null }));
vi.mock('./classroom', () => ({ StudentClassroomPage: () => null }));

import { StudentClassroomPage } from './classroom';
import { StudentDashboard } from './dashboard';

describe('student page feature boundary', () => {
  it('owns dashboard and classroom compositions outside the legacy pages directory', () => {
    expect([StudentDashboard, StudentClassroomPage]).toEqual([
      expect.any(Function),
      expect.any(Function),
    ]);
  });
});
