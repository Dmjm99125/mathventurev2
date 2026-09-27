export type PageInfo = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type TeacherDashboardAggregate = {
  classCount: number;
  studentCount: number;
  classes: {
    id: string;
    name: string;
    studentCount: number;
    attemptCount: number;
    averageScorePct: number | null;
  }[];
  strugglingLessons: {
    lessonId: string;
    attempts: number;
    averageScorePct: number;
  }[];
};

export type StudentDashboardAggregate = {
  completedLessons: number;
  streakDays: number;
  recentAttempts: {
    lessonId: string;
    score: number;
    maxScore: number;
    completedAt: string;
  }[];
};

export type TeacherReportAggregate = {
  classroom: {
    id: string;
    studentCount: number;
    activeStudentCount: number;
    averageScorePct: number | null;
    completionPct: number;
    lastActivityAt: string | null;
  };
  attentionStudents: {
    studentId: string;
    fullName: string;
    firstName: string;
    lastName: string | null;
    averageScorePct: number | null;
    completionPct: number;
    reasonCodes: string[];
  }[];
  recentActivity: {
    recentPasses: {
      studentId: string;
      fullName: string;
      gameId: string;
      gameTitle: string;
      completedAt: string;
      scorePct: number;
    }[];
    lastPlayedAt: string | null;
    inactiveStudentCount: number;
  };
  studentRows: {
    studentId: string;
    fullName: string;
    firstName: string;
    lastName: string | null;
    averageScorePct: number | null;
    completionPct: number;
    lastPlayedPct: number | null;
    lastActivityAt: string | null;
  }[];
  topicBreakdown: {
    topicId: string;
    averageScorePct: number | null;
    passCount: number;
    attemptCount: number;
    games: {
      gameId: string;
      gameOrder: number;
      title: string;
      averageScorePct: number | null;
      passCount: number;
      attemptCount: number;
      lastPlayedAt: string | null;
    }[];
  }[];
  page: PageInfo;
};

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Aggregate payload must contain objects");
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value;
}

function string(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  return value;
}

function number(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}

function nullableNumber(value: unknown, field: string): number | null {
  return value === null ? null : number(value, field);
}

function nullableString(value: unknown, field: string): string | null {
  return value === null ? null : string(value, field);
}

function boolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${field} must be boolean`);
  return value;
}

function pageInfo(value: unknown): PageInfo {
  const input = record(value);
  const nextCursor = input.nextCursor === null
    ? null
    : string(input.nextCursor, "page.nextCursor");
  return {
    nextCursor,
    hasMore: boolean(input.hasMore, "page.hasMore"),
  };
}

export function parseTeacherDashboardAggregate(
  value: unknown,
): TeacherDashboardAggregate {
  const input = record(value);
  return {
    classCount: number(input.classCount, "classCount"),
    studentCount: number(input.studentCount, "studentCount"),
    classes: array(input.classes, "classes").map((item, index) => {
      const row = record(item);
      return {
        id: string(row.id, `classes[${index}].id`),
        name: string(row.name, `classes[${index}].name`),
        studentCount: number(row.studentCount, `classes[${index}].studentCount`),
        attemptCount: number(row.attemptCount, `classes[${index}].attemptCount`),
        averageScorePct: nullableNumber(
          row.averageScorePct,
          `classes[${index}].averageScorePct`,
        ),
      };
    }),
    strugglingLessons: array(input.strugglingLessons, "strugglingLessons").map((item, index) => {
      const row = record(item);
      return {
        lessonId: string(row.lessonId, `strugglingLessons[${index}].lessonId`),
        attempts: number(row.attempts, `strugglingLessons[${index}].attempts`),
        averageScorePct: number(
          row.averageScorePct,
          `strugglingLessons[${index}].averageScorePct`,
        ),
      };
    }),
  };
}

export function parseStudentDashboardAggregate(
  value: unknown,
): StudentDashboardAggregate {
  const input = record(value);
  return {
    completedLessons: number(input.completedLessons, "completedLessons"),
    streakDays: number(input.streakDays, "streakDays"),
    recentAttempts: array(input.recentAttempts, "recentAttempts").map((item, index) => {
      const row = record(item);
      return {
        lessonId: string(row.lessonId, `recentAttempts[${index}].lessonId`),
        score: number(row.score, `recentAttempts[${index}].score`),
        maxScore: number(row.maxScore, `recentAttempts[${index}].maxScore`),
        completedAt: string(row.completedAt, `recentAttempts[${index}].completedAt`),
      };
    }),
  };
}

export function parseTeacherReportAggregate(value: unknown): TeacherReportAggregate {
  const input = record(value);
  const classroomInput = record(input.classroom);
  const activityInput = record(input.recentActivity);

  return {
    classroom: {
      id: string(classroomInput.id, "classroom.id"),
      studentCount: number(classroomInput.studentCount, "classroom.studentCount"),
      activeStudentCount: number(
        classroomInput.activeStudentCount,
        "classroom.activeStudentCount",
      ),
      averageScorePct: nullableNumber(
        classroomInput.averageScorePct,
        "classroom.averageScorePct",
      ),
      completionPct: number(classroomInput.completionPct, "classroom.completionPct"),
      lastActivityAt: nullableString(
        classroomInput.lastActivityAt,
        "classroom.lastActivityAt",
      ),
    },
    attentionStudents: array(input.attentionStudents, "attentionStudents").map((item, index) => {
      const row = record(item);
      return {
        studentId: string(row.studentId, `attentionStudents[${index}].studentId`),
        fullName: string(row.fullName, `attentionStudents[${index}].fullName`),
        firstName: string(row.firstName, `attentionStudents[${index}].firstName`),
        lastName: nullableString(row.lastName, `attentionStudents[${index}].lastName`),
        averageScorePct: nullableNumber(
          row.averageScorePct,
          `attentionStudents[${index}].averageScorePct`,
        ),
        completionPct: number(row.completionPct, `attentionStudents[${index}].completionPct`),
        reasonCodes: array(row.reasonCodes, `attentionStudents[${index}].reasonCodes`)
          .map((reason, reasonIndex) => string(
            reason,
            `attentionStudents[${index}].reasonCodes[${reasonIndex}]`,
          )),
      };
    }),
    recentActivity: {
      recentPasses: array(activityInput.recentPasses, "recentActivity.recentPasses").map((item, index) => {
        const row = record(item);
        return {
          studentId: string(row.studentId, `recentPasses[${index}].studentId`),
          fullName: string(row.fullName, `recentPasses[${index}].fullName`),
          gameId: string(row.gameId, `recentPasses[${index}].gameId`),
          gameTitle: string(row.gameTitle, `recentPasses[${index}].gameTitle`),
          completedAt: string(row.completedAt, `recentPasses[${index}].completedAt`),
          scorePct: number(row.scorePct, `recentPasses[${index}].scorePct`),
        };
      }),
      lastPlayedAt: nullableString(activityInput.lastPlayedAt, "recentActivity.lastPlayedAt"),
      inactiveStudentCount: number(
        activityInput.inactiveStudentCount,
        "recentActivity.inactiveStudentCount",
      ),
    },
    studentRows: array(input.studentRows, "studentRows").map((item, index) => {
      const row = record(item);
      return {
        studentId: string(row.studentId, `studentRows[${index}].studentId`),
        fullName: string(row.fullName, `studentRows[${index}].fullName`),
        firstName: string(row.firstName, `studentRows[${index}].firstName`),
        lastName: nullableString(row.lastName, `studentRows[${index}].lastName`),
        averageScorePct: nullableNumber(
          row.averageScorePct,
          `studentRows[${index}].averageScorePct`,
        ),
        completionPct: number(row.completionPct, `studentRows[${index}].completionPct`),
        lastPlayedPct: nullableNumber(row.lastPlayedPct, `studentRows[${index}].lastPlayedPct`),
        lastActivityAt: nullableString(
          row.lastActivityAt,
          `studentRows[${index}].lastActivityAt`,
        ),
      };
    }),
    topicBreakdown: array(input.topicBreakdown, "topicBreakdown").map((item, index) => {
      const row = record(item);
      return {
        topicId: string(row.topicId, `topicBreakdown[${index}].topicId`),
        averageScorePct: nullableNumber(
          row.averageScorePct,
          `topicBreakdown[${index}].averageScorePct`,
        ),
        passCount: number(row.passCount, `topicBreakdown[${index}].passCount`),
        attemptCount: number(row.attemptCount, `topicBreakdown[${index}].attemptCount`),
        games: array(row.games, `topicBreakdown[${index}].games`).map((game, gameIndex) => {
          const gameRow = record(game);
          return {
            gameId: string(gameRow.gameId, `games[${gameIndex}].gameId`),
            gameOrder: number(gameRow.gameOrder, `games[${gameIndex}].gameOrder`),
            title: string(gameRow.title, `games[${gameIndex}].title`),
            averageScorePct: nullableNumber(
              gameRow.averageScorePct,
              `games[${gameIndex}].averageScorePct`,
            ),
            passCount: number(gameRow.passCount, `games[${gameIndex}].passCount`),
            attemptCount: number(gameRow.attemptCount, `games[${gameIndex}].attemptCount`),
            lastPlayedAt: nullableString(
              gameRow.lastPlayedAt,
              `games[${gameIndex}].lastPlayedAt`,
            ),
          };
        }),
      };
    }),
    page: pageInfo(input.page),
  };
}
