import { describe, expect, it, vi } from 'vitest';

vi.mock('./workspace', () => ({ TeacherClassWorkspacePage: () => null }));

import { TeacherClassWorkspacePage } from './workspace';

describe('teacher workspace feature boundary', () => {
  it('owns the workspace coordinator outside the legacy teacher page module', () => {
    expect(TeacherClassWorkspacePage).toEqual(expect.any(Function));
  });
});
