import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { isAuthReadyForData } from '@features/auth/model/session-state';
import type { StudentDashboard, TeacherDashboard } from '@/lib/api/client';
import { api } from '@/lib/api/client';
import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';
import {
  buildOfflineStudentDashboard,
  buildOfflineTeacherDashboard,
} from '@/lib/offline/classroom/reports';
import { dashboardKeys } from '@infrastructure/api/queryKeys';

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function useStudentDashboard() {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery<StudentDashboard>({
    queryKey: dashboardKeys.student(),
    queryFn: async () => {
      const attempts = await repository.readCollection('attempts');
      if (attempts.length || browserIsOffline()) return buildOfflineStudentDashboard(attempts);
      return api.dashboard.student();
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherDashboard() {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery<TeacherDashboard>({
    queryKey: dashboardKeys.teacher(),
    queryFn: async () => {
      const [classrooms, students, attempts] = await Promise.all([
        repository.readCollection('classrooms'),
        repository.readCollection('classStudents'),
        repository.readCollection('attempts'),
      ]);
      if (classrooms.length || browserIsOffline()) return buildOfflineTeacherDashboard(classrooms, students, attempts);
      return api.dashboard.teacher();
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}
