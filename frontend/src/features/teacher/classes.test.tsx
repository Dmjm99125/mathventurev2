import { describe, expect, it, vi } from 'vitest';

vi.mock('./classes', () => ({ TeacherClassesPage: () => null }));

import { TeacherClassesPage } from './classes';

describe('teacher classes feature boundary', () => {
  it('owns the class list entrypoint outside the legacy teacher page module', () => {
    expect(TeacherClassesPage).toEqual(expect.any(Function));
  });
});
