import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type StudentClassSummary,
  type StudentClassroomSummary,
  type TeacherClassSummary,
  type TeacherClassroomSummary,
  api,
} from './client';
import type { TeacherAddStudentDraft } from '../teacher/add-students';
import type { TeacherReportsWindowKey } from '../teacher/reports';

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
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => toLegacyClassesResponse(await api.classes.list()),
  });
}

export function useTeacherClassroom() {
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
  });
}

export function useStudentClassroom() {
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
  });
}

export function useClassRoster(classId?: string) {
  return useQuery({
    queryKey: ['classroom', 'roster', classId ?? 'singleton'],
    queryFn: () => api.classes.roster(),
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

export function useTeacherReportsOverview(window: TeacherReportsWindowKey) {
  return useQuery({
    queryKey: ['teacher-reports', 'overview', window],
    queryFn: () => api.reports.overview(window),
  });
}

export function useTeacherClassReport(classId: string, window: TeacherReportsWindowKey) {
  return useQuery({
    queryKey: ['teacher-reports', 'class', classId, window],
    queryFn: () => api.reports.classDetail(classId, window),
    enabled: !!classId,
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
    mutationFn: ({ studentId }: { classId?: string; studentId: string }) =>
      api.classes.removeStudent(studentId),
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
  return useMutation({
    mutationFn: ({
      students,
    }: {
      classId?: string;
      students: TeacherAddStudentDraft[];
    }) => api.classes.addStudents(students),
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
  return useMutation({
    mutationFn: (input: {
      lessonId: string;
      assignmentId?: string;
      classId?: string;
      score: number;
      maxScore: number;
      durationSeconds?: number;
      gameResults?: import('./client').AttemptGameResultInput[];
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

