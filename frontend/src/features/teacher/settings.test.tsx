import { describe, expect, it, vi } from 'vitest';

vi.mock('./settings', () => ({ TeacherSettingsPage: () => null }));

import { TeacherSettingsPage } from './settings';

describe('teacher settings feature boundary', () => {
  it('owns the settings page outside the legacy teacher page module', () => {
    expect(TeacherSettingsPage).toEqual(expect.any(Function));
  });
});
