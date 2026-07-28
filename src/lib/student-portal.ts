export type PortalTopicId =
  | "colors"
  | "shapes"
  | "sequencing"
  | "addition"
  | "subtraction"
  | "numbers"
  | "measurement"
  | "comparison"
  | "clock";

export type PortalAssignment = {
  id: string;
  lessonId: string;
  dueAt: string | null;
  completed: boolean;
};

export type PortalRecentAttempt = {
  lessonId: string;
  score: number;
  maxScore: number;
  completedAt?: string;
};

export type PortalClass = {
  id: string;
  name: string;
  teacherName: string;
};

export type PortalDashboardSummary = {
  completedLessons: number;
  streakDays: number;
  recentAttempts: PortalRecentAttempt[];
};

export type PortalTopicEntry = {
  id: PortalTopicId;
  lessonNumber: number;
  fallbackLabel: string;
  assetSrc: string;
  href: string;
  isAssigned: boolean;
  isCompleted: boolean;
  recentScorePct: number | null;
};

export type PortalRailSummary = {
  nextAction:
    | { kind: "assignment"; lessonId: PortalTopicId; href: string; dueAt: string | null }
    | { kind: "free-play"; href: "/student/lessons" };
  primaryClass: PortalClass | null;
  classCount: number;
  completedLessons: number;
  streakDays: number;
  recentLessonId: PortalTopicId | null;
  recentScorePct: number | null;
  showJoinPrompt: boolean;
};

export const LEGACY_TOPIC_META: ReadonlyArray<{
  id: PortalTopicId;
  lessonNumber: number;
  fallbackLabel: string;
  assetSrc: string;
}> = [
  { id: "colors", lessonNumber: 1, fallbackLabel: "Colors", assetSrc: "/assets/images/1col.png" },
  { id: "shapes", lessonNumber: 2, fallbackLabel: "Shapes", assetSrc: "/assets/images/1sha.png" },
  { id: "sequencing", lessonNumber: 3, fallbackLabel: "Sequencing", assetSrc: "/assets/images/1seq.png" },
  { id: "addition", lessonNumber: 4, fallbackLabel: "Addition", assetSrc: "/assets/images/1add.png" },
  { id: "subtraction", lessonNumber: 5, fallbackLabel: "Subtraction", assetSrc: "/assets/images/1SUB.png" },
  { id: "numbers", lessonNumber: 6, fallbackLabel: "Numbers", assetSrc: "/assets/images/1NUM.png" },
  { id: "measurement", lessonNumber: 7, fallbackLabel: "Measurement", assetSrc: "/assets/images/1MEA.png" },
  { id: "comparison", lessonNumber: 8, fallbackLabel: "Comparison", assetSrc: "/assets/images/1COM.png" },
  { id: "clock", lessonNumber: 9, fallbackLabel: "Clock", assetSrc: "/assets/images/1CLO.png" },
] as const;

function toPortalTopicId(value: string): PortalTopicId | null {
  return LEGACY_TOPIC_META.find((topic) => topic.id === value)?.id ?? null;
}

export function buildPortalTopicEntries(input: {
  assignments: PortalAssignment[];
  recentAttempts: PortalRecentAttempt[];
}): PortalTopicEntry[] {
  const assignmentByLesson = new Map(
    input.assignments
      .filter((assignment) => !assignment.completed)
      .flatMap((assignment) => {
        const topicId = toPortalTopicId(assignment.lessonId);
        return topicId ? [[topicId, assignment] as const] : [];
      }),
  );

  const attemptsByLesson = new Map(
    input.recentAttempts.flatMap((attempt) => {
      const topicId = toPortalTopicId(attempt.lessonId);
      return topicId ? [[topicId, attempt] as const] : [];
    }),
  );

  return LEGACY_TOPIC_META.map((topic) => {
    const assignment = assignmentByLesson.get(topic.id);
    const attempt = attemptsByLesson.get(topic.id) ?? null;

    return {
      ...topic,
      href: assignment
        ? `/student/lessons/${topic.id}?assignmentId=${assignment.id}`
        : `/student/lessons/${topic.id}`,
      isAssigned: Boolean(assignment),
      isCompleted: Boolean(attempt),
      recentScorePct: attempt ? Math.round((attempt.score / attempt.maxScore) * 100) : null,
    };
  });
}

export function summarizePortalRail(input: {
  assignments: PortalAssignment[];
  classes: PortalClass[];
  dashboard: PortalDashboardSummary;
}): PortalRailSummary {
  const nextAssignment = input.assignments.find((assignment) => {
    return !assignment.completed && toPortalTopicId(assignment.lessonId) !== null;
  }) ?? null;

  const nextLessonId = nextAssignment ? toPortalTopicId(nextAssignment.lessonId) : null;
  const recentAttempt = input.dashboard.recentAttempts[0] ?? null;
  const recentLessonId = recentAttempt ? toPortalTopicId(recentAttempt.lessonId) : null;
  const primaryClass = input.classes[0] ?? null;

  return {
    nextAction: nextAssignment && nextLessonId
      ? {
          kind: "assignment",
          lessonId: nextLessonId,
          href: `/student/lessons/${nextLessonId}?assignmentId=${nextAssignment.id}`,
          dueAt: nextAssignment.dueAt,
        }
      : {
          kind: "free-play",
          href: "/student/lessons",
        },
    primaryClass,
    classCount: input.classes.length,
    completedLessons: input.dashboard.completedLessons,
    streakDays: input.dashboard.streakDays,
    recentLessonId,
    recentScorePct: recentAttempt
      ? Math.round((recentAttempt.score / recentAttempt.maxScore) * 100)
      : null,
    showJoinPrompt: input.classes.length === 0,
  };
}
