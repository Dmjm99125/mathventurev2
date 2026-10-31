import type {
  StudentDashboard,
  TeacherDashboard,
} from '@/lib/api/client';
import type {
  TeacherReportsWindowKey,
  TeacherSingleClassroomReportPayload,
} from '@/lib/teacher/reports';
import { invokeFunction } from './transport';

export const dashboardApi = {
  student: () => invokeFunction<StudentDashboard>('dashboard-student'),
  teacher: () => invokeFunction<TeacherDashboard>('dashboard-teacher'),
};

export const reportApi = {
  overview: (
    classId: string,
    window: TeacherReportsWindowKey,
    options?: { studentCursor?: string | null; pageSize?: number },
  ) =>
    invokeFunction<TeacherSingleClassroomReportPayload>('reports-overview', {
      searchParams: {
        classId,
        window,
        ...(options?.studentCursor ? { cursor: options.studentCursor } : {}),
        ...(options?.pageSize ? { pageSize: String(options.pageSize) } : {}),
      },
    }),

  classDetail: (
    classId: string,
    window: TeacherReportsWindowKey,
    options?: { studentCursor?: string | null; pageSize?: number },
  ) =>
    invokeFunction<TeacherSingleClassroomReportPayload>('reports-class', {
      searchParams: {
        classId,
        window,
        ...(options?.studentCursor ? { cursor: options.studentCursor } : {}),
        ...(options?.pageSize ? { pageSize: String(options.pageSize) } : {}),
      },
    }),
};
