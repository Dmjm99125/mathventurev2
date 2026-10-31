import { describe, expect, it } from 'vitest';
import type { TeacherClassSummary } from '@/lib/api/client';
import { isArchivedClass, splitTeacherClasses, teacherClassPath } from './classes';

const activeClass: TeacherClassSummary = {
  id: 'class-1',
  name: 'Room 1',
  createdAt: '2026-01-01T00:00:00Z',
  archivedAt: null,
  studentCount: 2,
};

const archivedClass: TeacherClassSummary = {
  ...activeClass,
  id: 'class-2',
  name: 'Archived room',
  archivedAt: '2026-01-01T00:00:00Z',
};

describe('teacher class model', () => {
  it('builds encoded workspace paths without changing section defaults', () => {
    expect(teacherClassPath('class 1')).toBe('/teacher/classes/class%201');
    expect(teacherClassPath('class 1', 'reports')).toBe('/teacher/classes/class%201/reports');
  });

  it('classifies archived classes and preserves active/archive ordering', () => {
    expect(isArchivedClass(activeClass)).toBe(false);
    expect(isArchivedClass(archivedClass)).toBe(true);
    expect(splitTeacherClasses([activeClass, archivedClass], [activeClass, archivedClass])).toEqual({
      active: [activeClass],
      archived: [archivedClass],
    });
  });
});
