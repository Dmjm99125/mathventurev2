import type { QueryClient } from '@tanstack/react-query';
import { assignmentKeys, classroomKeys, dashboardKeys, postKeys } from './queryKeys';

type QueryInvalidator = Pick<QueryClient, 'invalidateQueries'>;

export function invalidateAssignmentStarted(
  queryClient: QueryInvalidator,
  assignmentId: string,
  lessonId: string,
) {
  queryClient.invalidateQueries({ queryKey: assignmentKeys.quiz(assignmentId, lessonId) });
  queryClient.invalidateQueries({ queryKey: assignmentKeys.all() });
}

export function invalidateAssignmentCheckpointed(
  queryClient: QueryInvalidator,
  assignmentId: string,
  lessonId: string,
) {
  queryClient.invalidateQueries({ queryKey: assignmentKeys.quiz(assignmentId, lessonId) });
}

export function invalidateAssignmentCompleted(
  queryClient: QueryInvalidator,
  assignmentId: string,
  lessonId: string,
) {
  queryClient.invalidateQueries({ queryKey: assignmentKeys.quiz(assignmentId, lessonId) });
  queryClient.invalidateQueries({ queryKey: assignmentKeys.all() });
  queryClient.invalidateQueries({ queryKey: dashboardKeys.student() });
}

export function invalidateAssignmentCreated(queryClient: QueryInvalidator, classId?: string) {
  queryClient.invalidateQueries({ queryKey: assignmentKeys.list(classId) });
  queryClient.invalidateQueries({ queryKey: assignmentKeys.list() });
}

export function invalidateAssignmentChanged(queryClient: QueryInvalidator) {
  queryClient.invalidateQueries({ queryKey: assignmentKeys.all() });
  queryClient.invalidateQueries({ queryKey: classroomKeys.roster() });
  queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
}

export function invalidateAttemptSubmitted(queryClient: QueryInvalidator) {
  queryClient.invalidateQueries({ queryKey: dashboardKeys.student() });
  queryClient.invalidateQueries({ queryKey: assignmentKeys.all() });
}

export function invalidateClassCreated(queryClient: QueryInvalidator) {
  queryClient.invalidateQueries({ queryKey: classroomKeys.teacher() });
  queryClient.invalidateQueries({ queryKey: classroomKeys.all() });
  queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
}

export function invalidateClassChanged(queryClient: QueryInvalidator, classId: string) {
  queryClient.invalidateQueries({ queryKey: classroomKeys.all() });
  queryClient.invalidateQueries({ queryKey: classroomKeys.teacher(classId) });
  queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
}

export function invalidateStudentJoined(queryClient: QueryInvalidator) {
  queryClient.invalidateQueries({ queryKey: classroomKeys.student() });
  queryClient.invalidateQueries({ queryKey: classroomKeys.all() });
}

export function invalidateRosterChanged(queryClient: QueryInvalidator, classId?: string) {
  queryClient.invalidateQueries({ queryKey: classroomKeys.roster() });
  if (classId) queryClient.invalidateQueries({ queryKey: classroomKeys.classesRoster(classId) });
  queryClient.invalidateQueries({ queryKey: classroomKeys.all() });
  queryClient.invalidateQueries({ queryKey: dashboardKeys.teacher() });
}

export function invalidatePostCreated(queryClient: QueryInvalidator, classId: string) {
  queryClient.invalidateQueries({ queryKey: postKeys.list(classId) });
}
