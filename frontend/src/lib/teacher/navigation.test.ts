import { describe, expect, it } from 'vitest';
import { getTeacherWorkspaceNavItems, isTeacherNavActive, TEACHER_NAV_ITEMS } from './navigation';

describe('teacher navigation', () => {
  it('matches the teacher home and settings routes', () => {
    expect(isTeacherNavActive('/teacher', TEACHER_NAV_ITEMS[0].href)).toBe(true);
    expect(isTeacherNavActive('/teacher/settings?tab=account', TEACHER_NAV_ITEMS[1].href)).toBe(true);
    expect(isTeacherNavActive('/teacher/classes/class-1', TEACHER_NAV_ITEMS[0].href)).toBe(false);
  });

  it('matches a workspace section and its descendants', () => {
    const workspaceHref = '/teacher/classes/class-1/students';

    expect(isTeacherNavActive(workspaceHref, workspaceHref)).toBe(true);
    expect(isTeacherNavActive(`${workspaceHref}?filter=active#roster`, workspaceHref)).toBe(true);
    expect(isTeacherNavActive('/teacher/classes/class-1/assignments', workspaceHref)).toBe(false);
  });

  it('builds workspace navigation in the current order', () => {
    expect(getTeacherWorkspaceNavItems('class 1').map((item) => item.href)).toEqual([
      '/teacher/classes/class%201',
      '/teacher/classes/class%201/students',
      '/teacher/classes/class%201/assignments',
      '/teacher/classes/class%201/reports',
      '/teacher',
      '/teacher/settings',
    ]);
  });
});
