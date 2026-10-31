import { describe, expect, it } from 'vitest';
import { isStudentNavActive, STUDENT_NAV_ITEMS } from './navigation';

describe('student navigation', () => {
  it('keeps lessons active for the dashboard and lesson routes', () => {
    for (const path of ['/student', '/student/lessons', '/student/lessons/colors?freePlay=1', '/student/lessons/shapes#quiz']) {
      expect(isStudentNavActive(path, STUDENT_NAV_ITEMS[0].href)).toBe(true);
    }
  });

  it('keeps classroom active only on the classroom route', () => {
    expect(isStudentNavActive('/student/classroom?tab=posts', STUDENT_NAV_ITEMS[1].href)).toBe(true);
    expect(isStudentNavActive('/student', STUDENT_NAV_ITEMS[1].href)).toBe(false);
    expect(isStudentNavActive('/student/lessons/colors', STUDENT_NAV_ITEMS[1].href)).toBe(false);
  });

  it('ignores query strings and hash fragments when matching routes', () => {
    expect(isStudentNavActive('/student?view=recent#top', '/student')).toBe(true);
  });
});
