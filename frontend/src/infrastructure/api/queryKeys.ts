export const classroomKeys = {
  all: () => ['classes'] as const,
  teacher: (classId?: string | null) =>
    classId === undefined ? (['classroom', 'teacher'] as const) : (['classroom', 'teacher', classId] as const),
  student: () => ['classroom', 'student'] as const,
  roster: (classId?: string | null) =>
    classId === undefined ? (['classroom', 'roster'] as const) : (['classroom', 'roster', classId] as const),
  rosterStudent: (classId: string | null, studentId: string | null | undefined) =>
    ['classroom', 'roster', classId, 'student', studentId] as const,
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
  overview: (classId: string, window: string, studentCursor: string | null) =>
    ['teacher-reports', 'overview', classId, window, studentCursor] as const,
  class: (classId: string, window: string, studentCursor: string | null) =>
    ['teacher-reports', 'class', classId, window, studentCursor] as const,
};

export const postKeys = {
  list: (classId: string) => ['posts', classId] as const,
};
