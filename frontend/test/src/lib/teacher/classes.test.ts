import { assertEquals } from 'jsr:@std/assert';
import { isArchivedClass, splitTeacherClasses, teacherClassPath } from '../../../../src/features/teacher/model/classes.ts';

Deno.test('teacher class paths keep the selected class in every workspace route', () => {
  assertEquals(teacherClassPath('class/one'), '/teacher/classes/class%2Fone');
  assertEquals(teacherClassPath('class-1', 'students'), '/teacher/classes/class-1/students');
  assertEquals(teacherClassPath('class-1', 'reports'), '/teacher/classes/class-1/reports');
});

Deno.test('teacher class summaries separate active and archived classes', () => {
  const active = { id: 'class-1', name: 'Active', createdAt: '2026-10-01', archivedAt: null, studentCount: 1 };
  const archived = { id: 'class-2', name: 'Archived', createdAt: '2026-10-02', archivedAt: '2026-10-03', studentCount: 2 };

  assertEquals(isArchivedClass(archived), true);
  assertEquals(splitTeacherClasses([active, archived], [archived]), { active: [active], archived: [archived] });
});
