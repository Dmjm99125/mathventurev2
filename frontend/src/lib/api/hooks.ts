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
  createOfflinePost,
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
import { readOfflineClassroom, readOfflineRoster, readOfflineAssignments } from '../offline/classroom/queries';
import {
  buildOfflineStudentDashboard,
  buildOfflineTeacherClassReport,
  buildOfflineTeacherDashboard,
  readOfflinePosts,
} from '../offline/classroom/reports';
import { recordFreePlayCompletion } from '../offline/classroom/freePlay';

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
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      if (user) {
        const cached = await readOfflineClassroom(repository, user.role);
        if (cached || browserIsOffline()) return toLegacyClassesResponse({ classroom: cached });
      }
      return toLegacyClassesResponse(await api.classes.list());
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherClassroom() {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: ['classroom', 'teacher'],
    queryFn: async () => {
      if (user) {
        const cached = await readOfflineClassroom(repository, 'teacher');
        if (cached || browserIsOffline()) return { classroom: cached };
      }
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
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: ['classroom', 'student'],
    queryFn: async () => {
      if (user) {
        const cached = await readOfflineClassroom(repository, 'student');
        if (cached || browserIsOffline()) return { classroom: cached };
      }
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
  const { repository } = useOfflineClassroom();

  return useInfiniteQuery({
    queryKey: ['classroom', 'roster', classId ?? 'singleton'],
    queryFn: async ({ pageParam }) => {
      const cached = await readOfflineRoster(repository);
      if (cached.students.length || browserIsOffline()) return cached;
      return api.classes.roster({ cursor: pageParam });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useClassRosterStudent(studentId?: string | null) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: ['classroom', 'roster', 'student', studentId],
    queryFn: async () => {
      const cached = (await readOfflineRoster(repository)).students.filter((student) => student.id === studentId);
      if (cached.length || browserIsOffline()) return { students: cached, page: { nextCursor: null, hasMore: false } };
      return api.classes.rosterStudent(studentId!);
    },
    enabled: Boolean(studentId) && isAuthReadyForData(isLoading, user),
  });
}

export function useAssignments(classId?: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useInfiniteQuery({
    queryKey: ['assignments', classId],
    queryFn: async ({ pageParam }) => {
      const cached = await readOfflineAssignments(repository, user?.role === 'student' ? user.id : undefined);
      if (cached.length || browserIsOffline()) return { assignments: cached, page: { nextCursor: null, hasMore: false } };
      return api.assignments.list(classId, { cursor: pageParam });
    },
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
    queryFn: async () => {
      if (user) {
        const state = await readOfflineAssignmentQuiz(repository, user.id, assignmentId!, lessonId!);
        if (state.attemptId || browserIsOffline()) return { state };
      }
      return api.assignmentQuiz.get(assignmentId!, lessonId!);
    },
    enabled: Boolean(assignmentId && lessonId) && isAuthReadyForData(isLoading, user),
  });
}

export function useStartAssignmentQuiz() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async ({ assignmentId, lessonId }: { assignmentId: string; lessonId: string }) => {
      if (user) {
        const result = await startOfflineAssignmentQuiz(repository, user.id, assignmentId, lessonId);
        if (!browserIsOffline()) void syncNow();
        return { state: result.state };
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
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: Parameters<typeof api.assignmentQuiz.checkpoint>[0]) => {
      if (user) {
        const attempt = (await repository.readCollection('attempts')).find((row) => {
          return row.assignment_id === input.assignmentId && row.student_id === user.id;
        });
        if (!attempt?.id) throw new Error('Start the assignment quiz before saving progress.');
        const result = {
          state: await checkpointOfflineAssignmentQuiz(repository, user.id, {
            ...input,
            attemptId: String(attempt.id),
          }),
        };
        if (!browserIsOffline()) void syncNow();
        return result;
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
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: Parameters<typeof api.assignmentQuiz.complete>[0]) => {
      if (user) {
        const attempt = (await repository.readCollection('attempts')).find((row) => {
          return row.assignment_id === input.assignmentId && row.student_id === user.id;
        });
        if (!attempt?.id) throw new Error('Start the assignment quiz before completing it.');
        const result = {
          state: await completeOfflineAssignmentQuiz(repository, user.id, {
            ...input,
            attemptId: String(attempt.id),
          }),
        };
        if (!browserIsOffline()) void syncNow();
        return result;
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
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: ['dashboard', 'student'],
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

  return useQuery({
    queryKey: ['dashboard', 'teacher'],
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

export function useTeacherReportsOverview(window: TeacherReportsWindowKey, studentCursor?: string | null) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: ['teacher-reports', 'overview', window, studentCursor ?? null],
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
          String(classrooms[0]?.id ?? ''),
          window,
        );
      }
      return api.reports.overview(window, { studentCursor });
    },
    enabled: isAuthReadyForData(isLoading, user),
  });
}

export function useTeacherClassReport(classId: string, window: TeacherReportsWindowKey, studentCursor?: string | null) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: ['teacher-reports', 'class', classId, window, studentCursor ?? null],
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
      if (user) {
        const result = await createOfflineAssignment(repository, user.id, input);
        if (!browserIsOffline()) void syncNow();
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
      if (user) {
        const result = await updateOfflineAssignment(repository, user.id, input);
        if (!browserIsOffline()) void syncNow();
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
      if (user) {
        const result = await deleteOfflineAssignment(repository, user.id, assignmentId);
        if (!browserIsOffline()) void syncNow();
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
      if (user) {
        const result = await removeOfflineStudent(repository, user.id, studentId);
        if (!browserIsOffline()) void syncNow();
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
      if (user) {
        return addOfflineStudents(repository, user.id, students).then((result) => {
          if (!browserIsOffline()) void syncNow();
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
      if (user) {
        return submitOfflineAttempt(repository, user.id, input).then((result) => {
          if (!browserIsOffline()) void syncNow();
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

export function useRecordFreePlayCompletion() {
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: { gameId: string; score: number; maxScore: number; completedAt?: string }) => {
      if (!user || user.role !== 'student') throw new Error('Free Play progress requires a student session.');
      const result = await recordFreePlayCompletion(repository, user.id, input);
      if (!browserIsOffline()) void syncNow();
      return result;
    },
  });
}

export function useClassPosts(classId: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: ['posts', classId],
    queryFn: async () => {
      const posts = await readOfflinePosts(repository, classId);
      if (posts.length || browserIsOffline()) return { posts };
      return api.posts.list(classId);
    },
    enabled: !!classId && isAuthReadyForData(isLoading, user),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async ({ classId, content }: { classId: string, content: string }) => {
      if (user) {
        const result = await createOfflinePost(repository, user.id, { classId, content });
        if (!browserIsOffline()) void syncNow();
        return { post: { id: result.id, classId, content }, syncState: result.syncState };
      }
      return api.posts.create(classId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.classId] });
    },
  });
}

