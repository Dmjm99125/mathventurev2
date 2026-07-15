import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

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

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { lessonId: string; assignmentId?: string; score: number; maxScore: number; durationSeconds?: number }) => 
      api.attempts.submit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'student'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}
