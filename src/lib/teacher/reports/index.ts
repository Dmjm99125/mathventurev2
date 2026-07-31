import { GAME_CATALOG, getGameCatalogEntry } from "../../games/catalog.ts";

export type TeacherReportsWindowKey = "7d" | "30d" | "quarter" | "all";

export type TeacherReportClassRecord = {
  id: string;
  name: string;
  joinCode: string;
  studentCount: number;
};

export type TeacherReportStudentRecord = {
  id: string;
  classId: string;
  className: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  joinedAt: string;
};

export type TeacherReportGameResultRecord = {
  studentId: string;
  classId: string;
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  scorePct: number;
  passed: boolean;
  completedAt: string;
};

export type TeacherReportsOverviewPayload = {
  windowKey: TeacherReportsWindowKey;
  windowLabel: string;
  classSummaries: {
    id: string;
    name: string;
    joinCode: string;
    studentCount: number;
    activeStudentCount: number;
    averageScorePct: number | null;
    completionPct: number;
    lastActivityAt: string | null;
  }[];
  attentionStudents: {
    studentId: string;
    classId: string;
    className: string;
    fullName: string;
    firstName: string;
    lastName: string | null;
    averageScorePct: number | null;
    completionPct: number;
    reasonCodes: ("low_average" | "inactive_while_class_active" | "low_completion")[];
  }[];
  recentActivity: {
    activeClasses: { classId: string; className: string; lastActivityAt: string }[];
    recentPasses: {
      studentId: string;
      fullName: string;
      classId: string;
      className: string;
      gameId: string;
      completedAt: string;
      scorePct: number;
    }[];
    quietClasses: { classId: string; className: string; studentCount: number }[];
  };
};

export type TeacherClassReportPayload = {
  windowKey: TeacherReportsWindowKey;
  windowLabel: string;
  hasData: boolean;
  classSummary: {
    id: string;
    name: string;
    joinCode: string;
    studentCount: number;
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
};

type AttentionReasonCode = TeacherReportsOverviewPayload["attentionStudents"][number]["reasonCodes"][number];

export type TeacherSingleClassroomReportPayload = {
  windowKey: TeacherReportsWindowKey;
  windowLabel: string;
  hasData: boolean;
  classroomSummary: {
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
    reasonCodes: AttentionReasonCode[];
  }[];
  recentActivity: {
    recentPasses: {
      studentId: string;
      fullName: string;
      gameId: string;
      completedAt: string;
      scorePct: number;
    }[];
    lastPlayedAt: string | null;
    inactiveStudentCount: number;
  };
  studentRows: TeacherClassReportPayload["studentRows"];
  topicBreakdown: TeacherClassReportPayload["topicBreakdown"];
};

export function coerceTeacherReportsWindowKey(
  value: string | null | undefined,
): TeacherReportsWindowKey {
  if (value === "7d" || value === "30d" || value === "quarter" || value === "all") {
    return value;
  }

  return "all";
}

export function parseTeacherReportsWindow(search: string): TeacherReportsWindowKey {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return coerceTeacherReportsWindowKey(new URLSearchParams(query).get("window"));
}

export function resolveTeacherReportsWindow(
  key: TeacherReportsWindowKey,
  now = new Date(),
): {
  key: TeacherReportsWindowKey;
  label: string;
  startAt: string | null;
  endAt: string;
} {
  const endAt = now.toISOString();

  if (key === "all") {
    return {
      key,
      label: "All time",
      startAt: null,
      endAt,
    };
  }

  if (key === "7d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);
    return {
      key,
      label: "Last 7 days",
      startAt: start.toISOString(),
      endAt,
    };
  }

  if (key === "30d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 29);
    start.setUTCHours(0, 0, 0, 0);
    return {
      key,
      label: "Last 30 days",
      startAt: start.toISOString(),
      endAt,
    };
  }

  const startMonth = Math.floor(now.getUTCMonth() / 3) * 3;
  const start = new Date(Date.UTC(now.getUTCFullYear(), startMonth, 1, 0, 0, 0, 0));
  return {
    key,
    label: "This quarter",
    startAt: start.toISOString(),
    endAt,
  };
}

function isInWindow(timestamp: string, startAt: string | null, endAt: string): boolean {
  return (!startAt || timestamp >= startAt) && timestamp <= endAt;
}

function averageScorePct(rows: TeacherReportGameResultRecord[]): number | null {
  if (!rows.length) {
    return null;
  }

  const totalScore = rows.reduce((sum, row) => sum + row.score, 0);
  const totalMax = rows.reduce((sum, row) => sum + row.maxScore, 0);

  return totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;
}

function completionPct(rows: TeacherReportGameResultRecord[]): number {
  if (!rows.length) {
    return 0;
  }

  const passedIds = new Set(
    rows.filter((row) => row.passed).map((row) => row.gameId),
  );
  return Math.round((passedIds.size / GAME_CATALOG.length) * 100);
}

function latestCompletedAt(rows: TeacherReportGameResultRecord[]): string | null {
  if (!rows.length) {
    return null;
  }

  return [...rows]
    .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
    .at(-1)?.completedAt ?? null;
}

function byNewestFirst(left: { completedAt: string }, right: { completedAt: string }) {
  return right.completedAt.localeCompare(left.completedAt);
}

function toHiddenClassRecord(input: {
  id: string;
  studentCount: number;
}): TeacherReportClassRecord {
  return {
    id: input.id,
    name: "Classroom",
    joinCode: "",
    studentCount: input.studentCount,
  };
}

export function buildTeacherReportsOverview(input: {
  classes: TeacherReportClassRecord[];
  students: TeacherReportStudentRecord[];
  results: TeacherReportGameResultRecord[];
  windowKey: TeacherReportsWindowKey;
  now?: Date;
}): TeacherReportsOverviewPayload {
  const window = resolveTeacherReportsWindow(input.windowKey, input.now);
  const windowResults = input.results.filter((row) =>
    isInWindow(row.completedAt, window.startAt, window.endAt)
  );

  const studentsByClassId = new Map<string, TeacherReportStudentRecord[]>();
  for (const student of input.students) {
    const current = studentsByClassId.get(student.classId) ?? [];
    current.push(student);
    studentsByClassId.set(student.classId, current);
  }

  const classSummaries = input.classes
    .map((klass) => {
      const classStudents = studentsByClassId.get(klass.id) ?? [];
      const classResults = windowResults.filter((row) => row.classId === klass.id);
      const activeStudentIds = new Set(classResults.map((row) => row.studentId));
      const studentCompletionValues = classStudents.map((student) =>
        completionPct(classResults.filter((row) => row.studentId === student.id))
      );

      return {
        id: klass.id,
        name: klass.name,
        joinCode: klass.joinCode,
        studentCount: klass.studentCount,
        activeStudentCount: activeStudentIds.size,
        averageScorePct: averageScorePct(classResults),
        completionPct: classStudents.length
          ? Math.round(
              studentCompletionValues.reduce((sum, value) => sum + value, 0) / classStudents.length,
            )
          : 0,
        lastActivityAt: latestCompletedAt(classResults),
      };
    })
    .sort((left, right) => {
      const rightAverage = right.averageScorePct ?? -1;
      const leftAverage = left.averageScorePct ?? -1;
      if (rightAverage !== leftAverage) {
        return rightAverage - leftAverage;
      }
      return left.name.localeCompare(right.name);
    });

  const attentionStudents = input.students
    .map((student) => {
      const classResults = windowResults.filter((row) => row.classId === student.classId);
      const ownRows = classResults.filter((row) => row.studentId === student.id);
      const reasons: AttentionReasonCode[] = [];
      const average = averageScorePct(ownRows);
      const completion = completionPct(ownRows);

      if (average != null && average < 75) {
        reasons.push("low_average");
      }
      if (
        ownRows.length === 0
        && classResults.some((row) => row.studentId !== student.id)
      ) {
        reasons.push("inactive_while_class_active");
      }
      if (completion < 10) {
        reasons.push("low_completion");
      }

      return {
        studentId: student.id,
        classId: student.classId,
        className: student.className,
        fullName: student.fullName,
        firstName: student.firstName,
        lastName: student.lastName,
        averageScorePct: average,
        completionPct: completion,
        reasonCodes: reasons,
      };
    })
    .filter((row) => row.reasonCodes.length > 0)
    .sort((left, right) => {
      if (right.reasonCodes.length !== left.reasonCodes.length) {
        return right.reasonCodes.length - left.reasonCodes.length;
      }
      const leftAverage = left.averageScorePct ?? -1;
      const rightAverage = right.averageScorePct ?? -1;
      if (leftAverage !== rightAverage) {
        return leftAverage - rightAverage;
      }
      return left.fullName.localeCompare(right.fullName);
    });

  const studentByClassKey = new Map(
    input.students.map((student) => [`${student.classId}:${student.id}`, student] as const),
  );

  const recentPasses = windowResults
    .filter((row) => row.passed)
    .sort(byNewestFirst)
    .slice(0, 5)
    .map((row) => ({
      studentId: row.studentId,
      fullName: studentByClassKey.get(`${row.classId}:${row.studentId}`)?.fullName ?? "Student",
      classId: row.classId,
      className: studentByClassKey.get(`${row.classId}:${row.studentId}`)?.className ?? "Class",
      gameId: row.gameId,
      completedAt: row.completedAt,
      scorePct: row.scorePct,
    }));

  const activeClasses = classSummaries
    .filter((row): row is typeof row & { lastActivityAt: string } => row.lastActivityAt !== null)
    .sort((left, right) => right.lastActivityAt.localeCompare(left.lastActivityAt))
    .slice(0, 5)
    .map((row) => ({
      classId: row.id,
      className: row.name,
      lastActivityAt: row.lastActivityAt,
    }));

  const quietClasses = classSummaries
    .filter((row) => row.lastActivityAt === null)
    .map((row) => ({
      classId: row.id,
      className: row.name,
      studentCount: row.studentCount,
    }));

  return {
    windowKey: window.key,
    windowLabel: window.label,
    classSummaries,
    attentionStudents,
    recentActivity: {
      activeClasses,
      recentPasses,
      quietClasses,
    },
  };
}

export function buildTeacherClassReport(input: {
  classes: TeacherReportClassRecord[];
  students: TeacherReportStudentRecord[];
  results: TeacherReportGameResultRecord[];
  classId: string;
  windowKey: TeacherReportsWindowKey;
  now?: Date;
}): TeacherClassReportPayload {
  const klass = input.classes.find((row) => row.id === input.classId);
  if (!klass) {
    throw new Error("Class not found");
  }

  const window = resolveTeacherReportsWindow(input.windowKey, input.now);
  const classStudents = input.students.filter((student) => student.classId === input.classId);
  const windowResults = input.results.filter((row) =>
    row.classId === input.classId && isInWindow(row.completedAt, window.startAt, window.endAt)
  );

  const studentRows = classStudents
    .map((student) => {
      const ownRows = windowResults.filter((row) => row.studentId === student.id);
      const lastPlayed = [...ownRows]
        .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
        .at(-1) ?? null;

      return {
        studentId: student.id,
        fullName: student.fullName,
        firstName: student.firstName,
        lastName: student.lastName,
        averageScorePct: averageScorePct(ownRows),
        completionPct: completionPct(ownRows),
        lastPlayedPct: lastPlayed?.scorePct ?? null,
        lastActivityAt: lastPlayed?.completedAt ?? null,
      };
    })
    .sort((left, right) => {
      const rightAverage = right.averageScorePct ?? -1;
      const leftAverage = left.averageScorePct ?? -1;
      if (rightAverage !== leftAverage) {
        return rightAverage - leftAverage;
      }
      const leftName = `${left.lastName ?? ""}${left.firstName}`;
      const rightName = `${right.lastName ?? ""}${right.firstName}`;
      return leftName.localeCompare(rightName);
    });

  const topicIds = Array.from(new Set(windowResults.map((row) => row.topicId))).sort();
  const topicBreakdown = topicIds.map((topicId) => {
    const topicRows = windowResults.filter((row) => row.topicId === topicId);
    const games = Array.from(new Set(topicRows.map((row) => row.gameId)))
      .map((gameId) => {
        const gameRows = topicRows.filter((row) => row.gameId === gameId);
        const sample = gameRows[0];
        const catalogEntry = getGameCatalogEntry(sample.topicId, sample.gameOrder);
        return {
          gameId,
          gameOrder: sample.gameOrder,
          title: catalogEntry?.title ?? gameId,
          averageScorePct: averageScorePct(gameRows),
          passCount: gameRows.filter((row) => row.passed).length,
          attemptCount: gameRows.length,
          lastPlayedAt: latestCompletedAt(gameRows),
        };
      })
      .sort((left, right) => left.gameOrder - right.gameOrder);

    return {
      topicId,
      averageScorePct: averageScorePct(topicRows),
      passCount: topicRows.filter((row) => row.passed).length,
      attemptCount: topicRows.length,
      games,
    };
  });

  return {
    windowKey: window.key,
    windowLabel: window.label,
    hasData: windowResults.length > 0,
    classSummary: {
      id: klass.id,
      name: klass.name,
      joinCode: klass.joinCode,
      studentCount: klass.studentCount,
    },
    studentRows,
    topicBreakdown,
  };
}

export function buildTeacherSingleClassroomReport(input: {
  classroom: {
    id: string;
    studentCount: number;
  };
  students: TeacherReportStudentRecord[];
  results: TeacherReportGameResultRecord[];
  windowKey: TeacherReportsWindowKey;
  now?: Date;
}): TeacherSingleClassroomReportPayload {
  const classroomRecord = toHiddenClassRecord(input.classroom);
  const overview = buildTeacherReportsOverview({
    classes: [classroomRecord],
    students: input.students,
    results: input.results,
    windowKey: input.windowKey,
    now: input.now,
  });
  const classReport = buildTeacherClassReport({
    classes: [classroomRecord],
    students: input.students,
    results: input.results,
    classId: input.classroom.id,
    windowKey: input.windowKey,
    now: input.now,
  });
  const classroomSummary = overview.classSummaries[0] ?? {
    id: input.classroom.id,
    name: "Classroom",
    joinCode: "",
    studentCount: input.classroom.studentCount,
    activeStudentCount: 0,
    averageScorePct: null,
    completionPct: 0,
    lastActivityAt: null,
  };

  return {
    windowKey: classReport.windowKey,
    windowLabel: classReport.windowLabel,
    hasData: classReport.hasData,
    classroomSummary: {
      id: classroomSummary.id,
      studentCount: classroomSummary.studentCount,
      activeStudentCount: classroomSummary.activeStudentCount,
      averageScorePct: classroomSummary.averageScorePct,
      completionPct: classroomSummary.completionPct,
      lastActivityAt: classroomSummary.lastActivityAt,
    },
    attentionStudents: overview.attentionStudents.map((row) => ({
      studentId: row.studentId,
      fullName: row.fullName,
      firstName: row.firstName,
      lastName: row.lastName,
      averageScorePct: row.averageScorePct,
      completionPct: row.completionPct,
      reasonCodes: row.reasonCodes,
    })),
    recentActivity: {
      recentPasses: overview.recentActivity.recentPasses.map((row) => ({
        studentId: row.studentId,
        fullName: row.fullName,
        gameId: row.gameId,
        completedAt: row.completedAt,
        scorePct: row.scorePct,
      })),
      lastPlayedAt: classroomSummary.lastActivityAt,
      inactiveStudentCount: classReport.studentRows.filter((row) => row.lastActivityAt === null)
        .length,
    },
    studentRows: classReport.studentRows,
    topicBreakdown: classReport.topicBreakdown,
  };
}
