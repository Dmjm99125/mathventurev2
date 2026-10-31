import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { isAuthReadyForData } from '@/lib/auth/session-state';
import { api } from '@/lib/api/client';
import type { TeacherReportsWindowKey } from '@/lib/teacher/reports';
import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';
import { buildOfflineTeacherClassReport } from '@/lib/offline/classroom/reports';
import { reportKeys } from '@infrastructure/api/queryKeys';

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function useTeacherReportsOverview(classId: string, window: TeacherReportsWindowKey, studentCursor?: string | null) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: reportKeys.overview(classId, window, studentCursor ?? null),
    queryFn: async () => {
      const [classrooms, students, gameResults] = await Promise.all([
        repository.readCollection('classrooms'),
        repository.readCollection('classStudents'),
        repository.readCollection('attemptGameResults'),
      ]);
      if (classrooms.length || browserIsOffline()) {
        return buildOfflineTeacherClassReport(
          classrooms,
          students,
          gameResults,
          classId,
          window,
        );
      }
      return api.reports.overview(classId, window, { studentCursor });
    },
    enabled: Boolean(classId) && isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherClassReport(classId: string, window: TeacherReportsWindowKey, studentCursor?: string | null) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: reportKeys.class(classId, window, studentCursor ?? null),
    queryFn: async () => {
      const [classrooms, students, gameResults] = await Promise.all([
        repository.readCollection('classrooms'),
        repository.readCollection('classStudents'),
        repository.readCollection('attemptGameResults'),
      ]);
      if (classrooms.length || browserIsOffline()) {
        return buildOfflineTeacherClassReport(classrooms, students, gameResults, classId, window);
      }
      return api.reports.classDetail(classId, window, { studentCursor });
    },
    enabled: !!classId && isAuthReadyForData(isLoading, user),
  });
}
