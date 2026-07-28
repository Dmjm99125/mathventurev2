import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { TeacherAddStudentDraft } from './teacher-add-students';

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: () => api.classes.list(),
  });
}

export function useClassRoster(classId: string) {
  return useQuery({
    queryKey: ['classes', classId, 'roster'],
    queryFn: () => api.classes.roster(classId),
    enabled: !!classId,
  });
}

export function useAssignments(classId?: string) {
  return useQuery({
    queryKey: ['assignments', classId],
    queryFn: () => api.assignments.list(classId),
  });
}

export function useStudentDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: () => api.dashboard.student(),
  });
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'teacher'],
    queryFn: () => api.dashboard.teacher(),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.classes.create(name),
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { lessonId: string; classId?: string; studentId?: string; dueAt?: string }) => 
      api.assignments.create(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', variables.classId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', undefined] });
    },
  });
}

export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      api.classes.removeStudent(classId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes', variables.classId, 'roster'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'teacher'] });
    },
  });
}

export function useAddStudentsToClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      students,
    }: {
      classId: string;
      students: TeacherAddStudentDraft[];
    }) => api.classes.addStudents(classId, students),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['classes', variables.classId, 'roster'],
      });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'teacher'] });
    },
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      lessonId: string;
      assignmentId?: string;
      score: number;
      maxScore: number;
      durationSeconds?: number;
      gameResults?: import('./api').AttemptGameResultInput[];
    }) =>
      api.attempts.submit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'student'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useClassPosts(classId: string) {
  return useQuery({
    queryKey: ['posts', classId],
    queryFn: () => api.posts.list(classId),
    enabled: !!classId,
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

