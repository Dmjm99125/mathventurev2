import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { isAuthReadyForData } from '@/lib/auth/session-state';
import { api, type AttemptGameResultInput } from '@/lib/api/client';
import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';
import {
  createOfflineAssignment,
  deleteOfflineAssignment,
  updateOfflineAssignment,
} from '@/lib/offline/classroom/mutations';
import {
  checkpointOfflineAssignmentQuiz,
  completeOfflineAssignmentQuiz,
  readOfflineAssignmentQuiz,
  startOfflineAssignmentQuiz,
  submitOfflineAttempt,
} from '@/lib/offline/classroom/quiz';
import { readOfflineAssignments } from '@/lib/offline/classroom/queries';
import { assignmentKeys, classroomKeys, dashboardKeys } from '@infrastructure/api/queryKeys';

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function useAssignments(classId?: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useInfiniteQuery({
    queryKey: assignmentKeys.list(classId),
    queryFn: async ({ pageParam }) => {
      const cached = await readOfflineAssignments(repository, classId, user?.role === 'student' ? user.id : null);
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
    queryKey: assignmentKeys.quiz(assignmentId, lessonId),
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
      queryClient.invalidateQueries({ queryKey: assignmentKeys.quiz(variables.assignmentId, variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all() });
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
      queryClient.invalidateQueries({ queryKey: assignmentKeys.quiz(variables.assignmentId, variables.lessonId) });
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
      queryClient.invalidateQueries({ queryKey: assignmentKeys.quiz(variables.assignmentId, variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.student() });
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
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list(variables.classId) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list() });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: { assignmentId: string; lessonId: string; name?: string; classId?: string; dueAt?: string | null }) => {
      if (user) {
        const result = await updateOfflineAssignment(repository, user.id, input);
        if (!browserIsOffline()) void syncNow();
        return { assignment: { id: result.id, ...input }, syncState: result.syncState };
      }
      return api.assignments.update(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all() });
      queryClient.invalidateQueries({ queryKey: classroomKeys.roster() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string; classId?: string }) => {
      if (user) {
        const result = await deleteOfflineAssignment(repository, user.id, assignmentId);
        if (!browserIsOffline()) void syncNow();
        return { deleted: true as const, syncState: result.syncState };
      }
      return api.assignments.delete(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all() });
      queryClient.invalidateQueries({ queryKey: classroomKeys.roster() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
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
      gameResults?: AttemptGameResultInput[];
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
      queryClient.invalidateQueries({ queryKey: dashboardKeys.student() });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all() });
    },
  });
}
