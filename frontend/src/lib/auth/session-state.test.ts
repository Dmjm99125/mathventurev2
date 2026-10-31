import { describe, expect, it } from 'vitest';
import { buildAuthViewState, isAuthReadyForData } from '@features/auth/model/session-state';
import { profileFromAuthSession } from './profile';

const teacher = { id: 'teacher-1', role: 'teacher' as const, full_name: 'Ana Teacher' };
const student = { id: 'student-1', role: 'student' as const, full_name: 'Bela Student' };

describe('authentication view state', () => {
  it('does not enable protected data while auth is loading or signed out', () => {
    expect(isAuthReadyForData(true, teacher)).toBe(false);
    expect(isAuthReadyForData(false, null)).toBe(false);
    expect(isAuthReadyForData(false, { id: teacher.id })).toBe(true);
  });

  it('uses the teacher as the active user when no student account is being viewed', () => {
    expect(buildAuthViewState(teacher, null)).toEqual({
      user: teacher,
      teacherUser: teacher,
      viewingStudent: null,
      isViewingStudent: false,
    });
  });

  it('uses the viewed student as the active user while retaining the teacher account', () => {
    expect(buildAuthViewState(teacher, student)).toEqual({
      user: student,
      teacherUser: teacher,
      viewingStudent: student,
      isViewingStudent: true,
    });
  });

  it('represents the signed-out state with no active profiles', () => {
    expect(buildAuthViewState(null, null)).toEqual({
      user: null,
      teacherUser: null,
      viewingStudent: null,
      isViewingStudent: false,
    });
  });
});

describe('auth session profile mapping', () => {
  it('maps teacher metadata and preserves the display name', () => {
    expect(profileFromAuthSession({
      user: {
        id: teacher.id,
        user_metadata: { role: 'teacher', full_name: teacher.full_name },
      },
    })).toEqual(teacher);
  });

  it('defaults unknown roles to student and missing names to an empty string', () => {
    expect(profileFromAuthSession({
      user: { id: student.id, user_metadata: { role: 'unknown' } },
    })).toEqual({ ...student, full_name: '' });
  });

  it('maps a missing session to no profile', () => {
    expect(profileFromAuthSession(null)).toBeNull();
  });
});
