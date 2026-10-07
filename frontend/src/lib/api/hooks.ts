import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth';
import { isAuthReadyForData } from '../auth/session-state';
import {
  type StudentClassSummary,
  type StudentClassroomSummary,
  type TeacherClassSummary,
  type TeacherClassroomSummary,
  api,
} from './client';
import type { TeacherAddStudentDraft } from '../teacher/add-students';
import type { TeacherReportsWindowKey } from '../teacher/reports';
import { useOfflineClassroom } from '../offline/classroom/useOfflineClassroom';
import {
  addOfflineStudents,
  createOfflineAssignment,
  deleteOfflineAssignment,
  removeOfflineStudent,
  updateOfflineAssignment,
} from '../offline/classroom/mutations';
import {
  checkpointOfflineAssignmentQuiz,
  completeOfflineAssignmentQuiz,
  readOfflineAssignmentQuiz,
  startOfflineAssignmentQuiz,
  submitOfflineAttempt,
} from '../offline/classroom/quiz';

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function toLegacyClassesResponse(input: {
  classroom: TeacherClassroomSummary | StudentClassroomSummary | null;
}): { classes: (TeacherClassSummary | StudentClassSummary)[] } {
  if (!input.classroom) {
    return { classes: [] };
  }

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
      joinCode: '',
      createdAt: input.classroom.createdAt,
      studentCount: input.classroom.studentCount,
    }],
  };
}

export function useClasses() {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => toLegacyClassesResponse(await api.classes.list()),
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherClassroom() {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['classroom', 'teacher'],
    queryFn: async () => {
      const data = await api.classes.list();
      return {
        classroom: data.classroom && 'createdAt' in data.classroom
          ? data.classroom
          : null,
      };
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useStudentClassroom() {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['classroom', 'student'],
    queryFn: async () => {
      const data = await api.classes.list();
      return {
        classroom: data.classroom && 'teacherName' in data.classroom
          ? data.classroom
          : null,
      };
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useClassRoster(classId?: string) {
  const { user, isLoading } = useAuth();

  return useInfiniteQuery({
    queryKey: ['classroom', 'roster', classId ?? 'singleton'],
    queryFn: ({ pageParam }) => api.classes.roster({ cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useClassRosterStudent(studentId?: string | null) {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['classroom', 'roster', 'student', studentId],
    queryFn: () => api.classes.rosterStudent(studentId!),
    enabled: Boolean(studentId) && isAuthReadyForData(isLoading, user),
  });
}

export function useAssignments(classId?: string) {
  const { user, isLoading } = useAuth();

  return useInfiniteQuery({
    queryKey: ['assignments', classId],
    queryFn: ({ pageParam }) => api.assignments.list(classId, { cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useAssignmentQuiz(assignmentId?: string, lessonId?: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: ['assignment-quiz', assignmentId, lessonId],
    queryFn: async () => browserIsOffline() && user
      ? { state: await readOfflineAssignmentQuiz(repository, user.id, assignmentId!, lessonId!) }
      : api.assignmentQuiz.get(assignmentId!, lessonId!),
    enabled: Boolean(assignmentId && lessonId) && isAuthReadyForData(isLoading, user),
  });
}

export function useStartAssignmentQuiz() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository } = useOfflineClassroom();
  return useMutation({
    mutationFn: async ({ assignmentId, lessonId }: { assignmentId: string; lessonId: string }) => {
      if (browserIsOffline() && user) {
        return { state: (await startOfflineAssignmentQuiz(repository, user.id, assignmentId, lessonId)).state };
      }
      return api.assignmentQuiz.start(assignmentId, lessonId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-quiz', variables.assignmentId, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useCheckpointAssignmentQuiz() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: Parameters<typeof api.assignmentQuiz.checkpoint>[0]) => {
      if (browserIsOffline() && user) {
        const attempt = (await repository.readCollection('attempts')).find((row) => {
          return row.assignment_id === input.assignmentId && row.student_id === user.id;
        });
        if (!attempt?.id) throw new Error('Start the assignment quiz before saving progress.');
        return {
          state: await checkpointOfflineAssignmentQuiz(repository, user.id, {
            ...input,
            attemptId: String(attempt.id),
          }),
        };
      }
      return api.assignmentQuiz.checkpoint(input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-quiz', variables.assignmentId, variables.lessonId] });
    },
  });
}

export function useCompleteAssignmentQuiz() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: Parameters<typeof api.assignmentQuiz.complete>[0]) => {
      if (browserIsOffline() && user) {
        const attempt = (await repository.readCollection('attempts')).find((row) => {
          return row.assignment_id === input.assignmentId && row.student_id === user.id;
        });
        if (!attempt?.id) throw new Error('Start the assignment quiz before completing it.');
        return {
          state: await completeOfflineAssignmentQuiz(repository, user.id, {
            ...input,
            attemptId: String(attempt.id),
          }),
        };
      }
      return api.assignmentQuiz.complete(input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-quiz', variables.assignmentId, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'student'] });
    },
  });
}

export function useStudentDashboard() {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: () => api.dashboard.student(),
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherDashboard() {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'teacher'],
    queryFn: () => api.dashboard.teacher(),
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherReportsOverview(window: TeacherReportsWindowKey, studentCursor?: string | null) {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['teacher-reports', 'overview', window, studentCursor ?? null],
    queryFn: () => api.reports.overview(window, { studentCursor }),
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherClassReport(classId: string, window: TeacherReportsWindowKey, studentCursor?: string | null) {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['teacher-reports', 'class', classId, window, studentCursor ?? null],
    queryFn: () => api.reports.classDetail(classId, window, { studentCursor }),
    enabled: !!classId && isAuthReadyForData(isLoading, user),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.classes.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom', 'teacher'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'teacher'] });
    },
  });
}

export function useJoinClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (joinCode: string) => api.classes.join(joinCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom', 'student'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: { lessonId: string; name?: string; classId?: string; studentId?: string; dueAt?: string }) => {
      if (user && browserIsOffline()) {
        const result = await createOfflineAssignment(repository, user.id, input);
        void syncNow();
        return { assignment: { id: result.id, ...input }, syncState: result.syncState };
      }
      return api.assignments.create(input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', variables.classId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', undefined] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: { assignmentId: string; lessonId: string; name?: string; dueAt?: string | null }) => {
      if (user && browserIsOffline()) {
        const result = await updateOfflineAssignment(repository, user.id, input);
        void syncNow();
        return { assignment: { id: result.id, ...input }, syncState: result.syncState };
      }
      return api.assignments.update(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['classroom', 'roster'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'teacher'] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      if (user && browserIsOffline()) {
        const result = await deleteOfflineAssignment(repository, user.id, assignmentId);
        void syncNow();
        return { deleted: true as const, syncState: result.syncState };
      }
      return api.assignments.delete(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['classroom', 'roster'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'teacher'] });
    },
  });
}

export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async ({ studentId }: { classId?: string; studentId: string }) => {
      if (user && browserIsOffline()) {
        const result = await removeOfflineStudent(repository, user.id, studentId);
        void syncNow();
        return { removed: true as const, syncState: result.syncState };
      }
      return api.classes.removeStudent(studentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classroom', 'roster'] });
      if (variables.classId) {
        queryClient.invalidateQueries({ queryKey: ['classes', variables.classId, 'roster'] });
      }
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'teacher'] });
    },
  });
}

export function useAddStudentsToClass() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: ({
      students,
    }: {
      classId?: string;
      students: TeacherAddStudentDraft[];
    }) => {
      if (user && browserIsOffline()) {
        return addOfflineStudents(repository, user.id, students).then((result) => {
          void syncNow();
          return { createdCount: students.length, syncState: result.syncState };
        });
      }
      return api.classes.addStudents(students);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['classroom', 'roster'],
      });
      if (variables.classId) {
        queryClient.invalidateQueries({
          queryKey: ['classes', variables.classId, 'roster'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'teacher'] });
    },
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: {
      lessonId: string;
      assignmentId?: string;
      classId?: string;
      score: number;
      maxScore: number;
      durationSeconds?: number;
      gameResults?: import('./client').AttemptGameResultInput[];
    }) => {
      if (user && browserIsOffline()) {
        return submitOfflineAttempt(repository, user.id, input).then((result) => {
          void syncNow();
          return { attempt: { id: result.id }, syncState: result.syncState };
        });
      }
      return api.attempts.submit(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'student'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useClassPosts(classId: string) {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['posts', classId],
    queryFn: () => api.posts.list(classId),
    enabled: !!classId && isAuthReadyForData(isLoading, user),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, content }: { classId: string, content: string }) => api.posts.create(classId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.classId] });
    },
  });
}

