import type {
  PageInfo,
  StudentClassroomSummary,
  TeacherClassStudent,
  TeacherClassSummary,
} from '@/lib/api/client';
import type {
  TeacherAddStudentDraft,
  TeacherAddStudentsResult,
} from '@/lib/teacher/add-students';
import { invokeFunction } from './transport';

export const classroomApi = {
  list: () =>
    invokeFunction<{
      classes?: TeacherClassSummary[];
      archivedClasses?: TeacherClassSummary[];
      classroom?: TeacherClassSummary | StudentClassroomSummary | null;
    }>('classes-list'),

  create: (name: string) =>
    invokeFunction<{ classroom: TeacherClassSummary }>('classes-create', {
      method: 'POST',
      body: { name },
    }),

  update: (input: { classId: string; action: 'rename' | 'archive' | 'unarchive'; name?: string }) =>
    invokeFunction<{ classroom: TeacherClassSummary }>('classes-update', {
      method: 'POST',
      body: input,
    }),

  join: (joinCode?: string) =>
    invokeFunction<unknown>('classes-join', {
      method: 'POST',
      body: joinCode ? { joinCode } : undefined,
    }),

  roster: (classId: string, options?: { cursor?: string | null; pageSize?: number }) =>
    invokeFunction<{ students: TeacherClassStudent[]; page: PageInfo }>('classes-roster', {
      searchParams: {
        classId,
        ...(options?.pageSize ? { pageSize: String(options.pageSize) } : {}),
        ...(options?.cursor ? { cursor: options.cursor } : {}),
      },
    }),

  rosterStudent: (classId: string, studentId: string) =>
    invokeFunction<{ students: TeacherClassStudent[]; page: PageInfo }>('classes-roster', {
      searchParams: { classId, studentId },
    }),

  addStudents: (classId: string, students: TeacherAddStudentDraft[]) =>
    invokeFunction<TeacherAddStudentsResult>('classes-add-students', {
      method: 'POST',
      body: { classId, students },
    }),

  removeStudent: (classId: string, studentId: string) =>
    invokeFunction<{ removed: true }>('classes-remove-student', {
      method: 'POST',
      body: { classId, studentId },
    }),
};
