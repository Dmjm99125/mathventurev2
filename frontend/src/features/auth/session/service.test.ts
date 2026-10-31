import { describe, expect, it, vi } from 'vitest';
import { loadAuthSession } from './service';

const teacher = { id: 'teacher-1', role: 'teacher' as const, full_name: 'Teacher' };
const student = { id: 'student-1', role: 'student' as const, full_name: 'Student' };

function dependencies(overrides: Partial<Parameters<typeof loadAuthSession>[0]> = {}) {
  return {
    isOffline: false,
    getProfile: vi.fn().mockResolvedValue(teacher),
    getStudentSession: vi.fn().mockResolvedValue({ session: { user: { id: student.id } } }),
    readOfflineSession: vi.fn().mockResolvedValue(null),
    restoreOfflineSession: vi.fn().mockResolvedValue(teacher),
    profileFromSession: vi.fn().mockReturnValue(student),
    ...overrides,
  };
}

describe('auth session service', () => {
  it('loads the teacher and active student profile online', async () => {
    const result = await loadAuthSession(dependencies());

    expect(result).toEqual({
      teacherUser: teacher,
      viewingStudent: student,
      useStudentAuthClient: true,
    });
  });

  it('uses the offline teacher session without opening a student view', async () => {
    const deps = dependencies({ isOffline: true });

    const result = await loadAuthSession(deps);

    expect(result).toEqual({
      teacherUser: teacher,
      viewingStudent: null,
      useStudentAuthClient: false,
    });
    expect(deps.getProfile).not.toHaveBeenCalled();
    expect(deps.restoreOfflineSession).toHaveBeenCalledWith({ online: false });
  });

  it('falls back to the offline teacher profile when the online profile is absent', async () => {
    const offlineTeacher = { ...teacher, full_name: 'Offline Teacher' };
    const deps = dependencies({
      getProfile: vi.fn().mockResolvedValue(null),
      readOfflineSession: vi.fn().mockResolvedValue(offlineTeacher),
    });

    await expect(loadAuthSession(deps)).resolves.toMatchObject({
      teacherUser: offlineTeacher,
      viewingStudent: student,
      useStudentAuthClient: true,
    });
  });
});
