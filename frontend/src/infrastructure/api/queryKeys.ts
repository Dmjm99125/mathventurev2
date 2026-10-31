export const classroomKeys = {
  all: () => ['classroom'] as const,
  teacher: () => ['classroom', 'teacher'] as const,
  student: () => ['classroom', 'student'] as const,
  roster: (classId?: string) => ['classroom', 'roster', classId ?? 'singleton'] as const,
};

export const assignmentKeys = {
  list: (classId?: string) => ['assignments', classId] as const,
  quiz: (assignmentId: string, lessonId: string) =>
    ['assignment-quiz', assignmentId, lessonId] as const,
};

export const dashboardKeys = {
  student: () => ['dashboard', 'student'] as const,
  teacher: () => ['dashboard', 'teacher'] as const,
};

export const reportKeys = {
  overview: (window: string) => ['teacher-reports', 'overview', window] as const,
  class: (classId: string, window: string) =>
    ['teacher-reports', 'class', classId, window] as const,
};

export const postKeys = {
  list: (classId: string) => ['posts', classId] as const,
};
