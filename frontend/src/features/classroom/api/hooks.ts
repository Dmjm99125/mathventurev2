import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { isAuthReadyForData } from '@features/auth/model/session-state';
import {
  api,
  type StudentClassSummary,
  type StudentClassroomSummary,
  type TeacherClassSummary,
  type TeacherClassroomSummary,
  type TeacherClassesListResponse,
} from '@/lib/api/client';
import type { TeacherAddStudentDraft } from '@/lib/teacher/add-students';
import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';
import {
  addOfflineStudents,
  removeOfflineStudent,
} from '@/lib/offline/classroom/mutations';
import { readOfflineClassroom, readOfflineTeacherClasses, readOfflineRoster } from '@/lib/offline/classroom/queries';
import { classroomKeys, dashboardKeys } from '@infrastructure/api/queryKeys';

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function toLegacyClassesResponse(input: {
  classroom: { id: string; createdAt: string; studentCount: number } | StudentClassroomSummary | null;
}): { classes: (TeacherClassSummary | StudentClassSummary)[] } {
  if (!input.classroom) return { classes: [] };

  if ('teacherName' in input.classroom) {
    return {
      classes: [{
        id: input.classroom.id,
        name: 'Classroom',
        teacherName: input.classroom.teacherName,
        joinedAt: input.classroom.joinedAt,
      }],
    };
  }

  return {
    classes: [{
      id: input.classroom.id,
      name: 'Classroom',
      createdAt: input.classroom.createdAt,
      archivedAt: null,
      studentCount: input.classroom.studentCount,
    }],
  };
}

export function useClasses() {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: classroomKeys.all(),
    queryFn: async () => {
      if (user) {
        if (user.role === 'teacher') {
          const cachedClasses = await readOfflineTeacherClasses(repository);
          if (browserIsOffline()) {
            return {
              classes: cachedClasses.filter((classroom) => classroom.archivedAt === null),
              archivedClasses: cachedClasses.filter((classroom) => classroom.archivedAt !== null),
            } satisfies TeacherClassesListResponse;
          }
        }
        const cached = await readOfflineClassroom(repository, user.role);
        if (browserIsOffline()) return toLegacyClassesResponse({ classroom: cached });
      }
      const data = await api.classes.list();
      if (user?.role === 'teacher' && data.classes) {
        return {
          classes: data.classes,
          archivedClasses: data.archivedClasses ?? [],
        } satisfies TeacherClassesListResponse;
      }
      return toLegacyClassesResponse({ classroom: data.classroom ?? null });
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherClassroom(classId?: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: classroomKeys.teacher(classId ?? null),
    queryFn: async () => {
      if (!classId) return { classroom: null };
      if (user) {
        const cached = await readOfflineClassroom(repository, 'teacher', classId);
        if (browserIsOffline()) return { classroom: cached && cached.id === classId ? cached : null };
      }
      const data = await api.classes.list();
      const classrooms = [...(data.classes ?? []), ...(data.archivedClasses ?? [])];
      return { classroom: classrooms.find((classroom) => classroom.id === classId) ?? null };
    },
    enabled: Boolean(classId) && isAuthReadyForData(isLoading, user),
  });
}

export function useStudentClassroom() {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: classroomKeys.student(),
    queryFn: async () => {
      if (user) {
        const cached = await readOfflineClassroom(repository, 'student');
        if (cached || browserIsOffline()) return { classroom: cached };
      }
      const data = await api.classes.list();
      return {
        classroom: data.classroom && 'teacherName' in data.classroom ? data.classroom : null,
      };
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useClassRoster(classId?: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useInfiniteQuery({
    queryKey: classroomKeys.roster(classId ?? null),
    queryFn: async ({ pageParam }) => {
      const cached = await readOfflineRoster(repository, classId);
      if (cached.students.length || browserIsOffline()) return cached;
      return api.classes.roster(classId!, { cursor: pageParam });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    enabled: Boolean(classId) && isAuthReadyForData(isLoading, user),
  });
}

export function useClassRosterStudent(classId?: string, studentId?: string | null) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: classroomKeys.rosterStudent(classId ?? null, studentId),
    queryFn: async () => {
      const cached = (await readOfflineRoster(repository, classId)).students.filter((student) => student.id === studentId);
      if (cached.length || browserIsOffline()) return { students: cached, page: { nextCursor: null, hasMore: false } };
      return api.classes.rosterStudent(classId!, studentId!);
    },
    enabled: Boolean(classId && studentId) && isAuthReadyForData(isLoading, user),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  const { bootstrapNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: (name: string) => {
      if (browserIsOffline()) throw new Error('Creating classes requires an internet connection.');
      return api.classes.create(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.teacher() });
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
      void bootstrapNow().catch(() => {});
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  const { bootstrapNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: (input: { classId: string; action: 'rename' | 'archive' | 'unarchive'; name?: string }) => {
      if (browserIsOffline()) throw new Error('Class changes require an internet connection.');
      return api.classes.update(input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() });
      queryClient.invalidateQueries({ queryKey: classroomKeys.teacher(variables.classId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
      void bootstrapNow().catch(() => {});
    },
  });
}

export function useJoinClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (joinCode: string) => api.classes.join(joinCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.student() });
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() });
    },
  });
}

export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      if (user) {
        const result = await removeOfflineStudent(repository, user.id, classId, studentId);
        if (!browserIsOffline()) void syncNow();
        return { removed: true as const, syncState: result.syncState };
      }
      return api.classes.removeStudent(classId, studentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.roster() });
      if (variables.classId) queryClient.invalidateQueries({ queryKey: classroomKeys.classesRoster(variables.classId) });
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
    },
  });
}

export function useAddStudentsToClass() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: ({ classId, students }: { classId: string; students: TeacherAddStudentDraft[] }) => {
      if (user) {
        return addOfflineStudents(repository, user.id, classId, students).then((result) => {
          if (!browserIsOffline()) void syncNow();
          return { createdCount: students.length, syncState: result.syncState };
        });
      }
      return api.classes.addStudents(classId, students);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.roster() });
      if (variables.classId) queryClient.invalidateQueries({ queryKey: classroomKeys.classesRoster(variables.classId) });
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
    },
  });
}
