# Teacher Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real teacher `Reports` tab as a cross-class overview with preset windows, class drill-down reports, deterministic attention rules, and class-level PDF export.

**Architecture:** Keep the existing teacher shell and add a dedicated reporting stack instead of stretching the current dashboard endpoints. Put preset-window parsing, aggregation, and attention-rule math in a shared Deno-testable `src/lib/teacher-reports.ts` module imported by both new Supabase edge handlers. Use one overview endpoint and one class-detail endpoint, then generate the class PDF client-side from the same class-detail payload so the downloaded report stays aligned with the on-screen data.

**Tech Stack:** React 19, TypeScript, Wouter, TanStack React Query, Tailwind CSS 4, Supabase Edge Functions (Deno), Deno tests, `jspdf`, `jspdf-autotable`, Vite, `tsc`

## Global Constraints

- `/teacher/reports` must be the reports landing page.
- The landing page priority order is class performance comparison, then students needing attention, then recent activity and momentum, then export guidance.
- A class report must show the student table first and the topic/game breakdown below it.
- Time filtering uses preset windows only: `Last 7 days`, `Last 30 days`, `This quarter`, and `All time`.
- PDF export is the first and only required export format in this phase.
- PDF export starts from the class-detail report only, not the cross-class landing page.
- Reports should use trustworthy detailed game-result history instead of inventing estimates from topic-level totals.
- The `students needing attention` rules must be deterministic and visible in code.
- The reports layout should consume the available page width rather than shrinking into a narrow analytics island.
- Do not add a new reporting schema unless implementation proves it is necessary.
- If database changes are needed, each schema change must be created as its own new PostgreSQL migration file rather than editing old migration files.

---

## File Map

- Create: `src/lib/teacher-reports.ts`
  Responsibility: own preset-window parsing, date-range resolution, overview aggregation, class-report aggregation, and deterministic attention rules.
- Create: `src/lib/teacher-reports.test.ts`
  Responsibility: prove preset-window defaults, window filtering, class ranking, attention rules, and class-detail breakdown math.
- Create: `supabase/functions/_shared/teacher_reports.ts`
  Responsibility: load the teacher-owned classes, enrollments, and detailed game-result rows needed by both report endpoints.
- Create: `supabase/functions/reports-overview/handler.ts`
  Responsibility: enforce teacher auth, load the shared dataset, build the overview payload, and return honest empty states.
- Create: `supabase/functions/reports-overview/handler_test.ts`
  Responsibility: prove teacher-only access, selected-window filtering, class summaries, and attention list behavior.
- Create: `supabase/functions/reports-overview/index.ts`
  Responsibility: thin edge-function entrypoint for the overview handler.
- Create: `supabase/functions/reports-class/handler.ts`
  Responsibility: enforce teacher auth, verify teacher-owned class access, build the class-detail payload, and expose the same data shape used by PDF export.
- Create: `supabase/functions/reports-class/handler_test.ts`
  Responsibility: prove unauthorized access, missing-class handling, honest no-data windows, and topic/game aggregation.
- Create: `supabase/functions/reports-class/index.ts`
  Responsibility: thin edge-function entrypoint for the class-detail handler.
- Modify: `package.json`
  Responsibility: add client-side PDF dependencies.
- Modify: `package-lock.json`
  Responsibility: capture the resolved PDF dependency tree.
- Create: `src/lib/teacher-reports-pdf.ts`
  Responsibility: convert the class-detail payload into a deterministic PDF model and save a PDF file in the browser.
- Create: `src/lib/teacher-reports-pdf.test.ts`
  Responsibility: prove filename, header text, student rows, and topic rows are derived from the class payload correctly.
- Modify: `src/lib/api.ts`
  Responsibility: define the report payload types and expose `reports.overview()` and `reports.classDetail()` wrappers.
- Modify: `src/lib/hooks.ts`
  Responsibility: expose `useTeacherReportsOverview()` and `useTeacherClassReport()` query hooks.
- Modify: `src/lib/teacher-nav.ts`
  Responsibility: keep the `Reports` rail item active for `/teacher/reports/classes/:classId`.
- Modify: `src/lib/teacher-nav.test.ts`
  Responsibility: prove the updated reports sub-route still highlights the `Reports` tab.
- Create: `src/components/teacher/reports/TeacherReportsWindowPicker.tsx`
  Responsibility: render the shared preset-window controls for the landing page and class page.
- Create: `src/components/teacher/reports/TeacherReportsClassComparison.tsx`
  Responsibility: render the dominant cross-class comparison section with drill-down actions.
- Create: `src/components/teacher/reports/TeacherReportsAttentionList.tsx`
  Responsibility: render the deterministic attention shortlist with reason badges and class links.
- Create: `src/components/teacher/reports/TeacherReportsRecentActivity.tsx`
  Responsibility: render recent active classes, recent passes, and quiet classes for the selected window.
- Create: `src/components/teacher/reports/TeacherClassReportStudentTable.tsx`
  Responsibility: render the class-detail student comparison table with sortable numeric columns.
- Create: `src/components/teacher/reports/TeacherClassReportTopicBreakdown.tsx`
  Responsibility: render the topic-level summaries with expandable game rows.
- Create: `src/components/teacher/reports/TeacherClassReportPdfButton.tsx`
  Responsibility: disable export when the window has no data and trigger the client-side PDF download when it does.
- Modify: `src/pages/teacher.tsx`
  Responsibility: replace the reports placeholder with the real overview page and add the class-detail report page exports.
- Modify: `src/App.tsx`
  Responsibility: route `/teacher/reports` to the overview page and `/teacher/reports/classes/:classId` to the class-detail page.

### Task 1: Shared Report Windows And Aggregation Helpers

**Files:**
- Create: `src/lib/teacher-reports.ts`
- Create: `src/lib/teacher-reports.test.ts`

**Interfaces:**
- Consumes: `GAME_CATALOG` and `getGameCatalogEntry` from `src/lib/game-catalog.ts`
- Produces: `type TeacherReportsWindowKey = "7d" | "30d" | "quarter" | "all"`
- Produces: `type TeacherReportClassRecord = { id: string; name: string; joinCode: string; studentCount: number }`
- Produces: `type TeacherReportStudentRecord = { id: string; classId: string; className: string; fullName: string; firstName: string; lastName: string | null; joinedAt: string }`
- Produces: `type TeacherReportGameResultRecord = { studentId: string; classId: string; topicId: string; gameId: string; gameOrder: number; score: number; maxScore: number; scorePct: number; passed: boolean; completedAt: string }`
- Produces: `function coerceTeacherReportsWindowKey(value: string | null | undefined): TeacherReportsWindowKey`
- Produces: `function parseTeacherReportsWindow(search: string): TeacherReportsWindowKey`
- Produces: `function resolveTeacherReportsWindow(key: TeacherReportsWindowKey, now?: Date): { key: TeacherReportsWindowKey; label: string; startAt: string | null; endAt: string }`
- Produces: `function buildTeacherReportsOverview(input: { classes: TeacherReportClassRecord[]; students: TeacherReportStudentRecord[]; results: TeacherReportGameResultRecord[]; windowKey: TeacherReportsWindowKey; now?: Date }): TeacherReportsOverviewPayload`
- Produces: `function buildTeacherClassReport(input: { classes: TeacherReportClassRecord[]; students: TeacherReportStudentRecord[]; results: TeacherReportGameResultRecord[]; classId: string; windowKey: TeacherReportsWindowKey; now?: Date }): TeacherClassReportPayload`

- [ ] **Step 1: Write the failing shared-report tests**

```ts
// src/lib/teacher-reports.test.ts
import { assertEquals } from "jsr:@std/assert";
import {
  buildTeacherClassReport,
  buildTeacherReportsOverview,
  coerceTeacherReportsWindowKey,
  parseTeacherReportsWindow,
  resolveTeacherReportsWindow,
} from "./teacher-reports.ts";

Deno.test("teacher report windows default to all and resolve quarter boundaries", () => {
  assertEquals(coerceTeacherReportsWindowKey(null), "all");
  assertEquals(coerceTeacherReportsWindowKey("weird"), "all");
  assertEquals(parseTeacherReportsWindow("?window=30d"), "30d");

  const resolved = resolveTeacherReportsWindow("quarter", new Date("2026-07-29T09:00:00.000Z"));
  assertEquals(resolved.label, "This quarter");
  assertEquals(resolved.startAt, "2026-07-01T00:00:00.000Z");
  assertEquals(resolved.endAt, "2026-07-29T09:00:00.000Z");
});

Deno.test("buildTeacherReportsOverview ranks classes and flags attention students in the selected window", () => {
  const overview = buildTeacherReportsOverview({
    classes: [
      { id: "class-a", name: "Class A", joinCode: "AAA111", studentCount: 2 },
      { id: "class-b", name: "Class B", joinCode: "BBB222", studentCount: 1 },
    ],
    students: [
      {
        id: "student-1",
        classId: "class-a",
        className: "Class A",
        fullName: "Maria Santos",
        firstName: "Maria",
        lastName: "Santos",
        joinedAt: "2026-07-01T00:00:00.000Z",
      },
      {
        id: "student-2",
        classId: "class-a",
        className: "Class A",
        fullName: "Paolo Cruz",
        firstName: "Paolo",
        lastName: "Cruz",
        joinedAt: "2026-07-01T00:00:00.000Z",
      },
      {
        id: "student-3",
        classId: "class-b",
        className: "Class B",
        fullName: "Lia Reyes",
        firstName: "Lia",
        lastName: "Reyes",
        joinedAt: "2026-07-01T00:00:00.000Z",
      },
    ],
    results: [
      {
        studentId: "student-1",
        classId: "class-a",
        topicId: "colors",
        gameId: "colors:0",
        gameOrder: 0,
        score: 1,
        maxScore: 1,
        scorePct: 100,
        passed: true,
        completedAt: "2026-07-28T08:00:00.000Z",
      },
      {
        studentId: "student-2",
        classId: "class-a",
        topicId: "colors",
        gameId: "colors:1",
        gameOrder: 1,
        score: 0,
        maxScore: 1,
        scorePct: 0,
        passed: false,
        completedAt: "2026-07-27T08:00:00.000Z",
      },
      {
        studentId: "student-3",
        classId: "class-b",
        topicId: "shapes",
        gameId: "shapes:0",
        gameOrder: 0,
        score: 1,
        maxScore: 1,
        scorePct: 100,
        passed: true,
        completedAt: "2026-07-10T08:00:00.000Z",
      },
    ],
    windowKey: "7d",
    now: new Date("2026-07-29T09:00:00.000Z"),
  });

  assertEquals(overview.classSummaries.map((row) => row.id), ["class-a", "class-b"]);
  assertEquals(overview.classSummaries[0].averageScorePct, 50);
  assertEquals(overview.attentionStudents[0].reasonCodes, [
    "low_average",
    "low_completion",
  ]);
  assertEquals(overview.recentActivity.quietClasses, [
    { classId: "class-b", className: "Class B", studentCount: 1 },
  ]);
});

Deno.test("buildTeacherClassReport aggregates student rows and topic rows without fabricating empty windows", () => {
  const report = buildTeacherClassReport({
    classes: [{ id: "class-a", name: "Class A", joinCode: "AAA111", studentCount: 1 }],
    students: [
      {
        id: "student-1",
        classId: "class-a",
        className: "Class A",
        fullName: "Maria Santos",
        firstName: "Maria",
        lastName: "Santos",
        joinedAt: "2026-07-01T00:00:00.000Z",
      },
    ],
    results: [
      {
        studentId: "student-1",
        classId: "class-a",
        topicId: "colors",
        gameId: "colors:0",
        gameOrder: 0,
        score: 1,
        maxScore: 1,
        scorePct: 100,
        passed: true,
        completedAt: "2026-07-28T08:00:00.000Z",
      },
    ],
    classId: "class-a",
    windowKey: "30d",
    now: new Date("2026-07-29T09:00:00.000Z"),
  });

  assertEquals(report.hasData, true);
  assertEquals(report.studentRows[0].averageScorePct, 100);
  assertEquals(report.studentRows[0].lastPlayedPct, 100);
  assertEquals(report.topicBreakdown[0].topicId, "colors");
  assertEquals(report.topicBreakdown[0].games[0].gameId, "colors:0");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test src/lib/teacher-reports.test.ts`
Expected: FAIL with `Module not found` for `src/lib/teacher-reports.ts`.

- [ ] **Step 3: Implement the shared report helpers**

```ts
// src/lib/teacher-reports.ts
import { GAME_CATALOG, getGameCatalogEntry } from "./game-catalog.ts";

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

export function coerceTeacherReportsWindowKey(
  value: string | null | undefined,
): TeacherReportsWindowKey {
  return value === "7d" || value === "30d" || value === "quarter" || value === "all"
    ? value
    : "all";
}

export function parseTeacherReportsWindow(search: string): TeacherReportsWindowKey {
  return coerceTeacherReportsWindowKey(
    new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("window"),
  );
}

export function resolveTeacherReportsWindow(
  key: TeacherReportsWindowKey,
  now = new Date(),
) {
  const endAt = now.toISOString();
  if (key === "all") {
    return { key, label: "All time", startAt: null, endAt };
  }
  if (key === "7d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);
    return { key, label: "Last 7 days", startAt: start.toISOString(), endAt };
  }
  if (key === "30d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 29);
    start.setUTCHours(0, 0, 0, 0);
    return { key, label: "Last 30 days", startAt: start.toISOString(), endAt };
  }

  const startMonth = Math.floor(now.getUTCMonth() / 3) * 3;
  const start = new Date(Date.UTC(now.getUTCFullYear(), startMonth, 1, 0, 0, 0, 0));
  return { key, label: "This quarter", startAt: start.toISOString(), endAt };
}

function inWindow(timestamp: string, startAt: string | null, endAt: string): boolean {
  return (!startAt || timestamp >= startAt) && timestamp <= endAt;
}

function averagePct(rows: TeacherReportGameResultRecord[]): number | null {
  if (!rows.length) return null;
  const totalScore = rows.reduce((sum, row) => sum + row.score, 0);
  const totalMax = rows.reduce((sum, row) => sum + row.maxScore, 0);
  return totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;
}

function completionPct(rows: TeacherReportGameResultRecord[]): number {
  const passedIds = new Set(rows.filter((row) => row.passed).map((row) => row.gameId));
  return Math.round((passedIds.size / GAME_CATALOG.length) * 100);
}

function latestTimestamp(rows: TeacherReportGameResultRecord[]): string | null {
  return rows.length
    ? [...rows].sort((left, right) => left.completedAt.localeCompare(right.completedAt)).at(-1)!.completedAt
    : null;
}

export function buildTeacherReportsOverview(
  input: {
    classes: TeacherReportClassRecord[];
    students: TeacherReportStudentRecord[];
    results: TeacherReportGameResultRecord[];
    windowKey: TeacherReportsWindowKey;
    now?: Date;
  },
): TeacherReportsOverviewPayload {
  const window = resolveTeacherReportsWindow(input.windowKey, input.now);
  const windowResults = input.results.filter((row) => inWindow(row.completedAt, window.startAt, window.endAt));
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
      const byStudent = classStudents.map((student) => {
        const ownRows = classResults.filter((row) => row.studentId === student.id);
        return completionPct(ownRows);
      });
      return {
        id: klass.id,
        name: klass.name,
        joinCode: klass.joinCode,
        studentCount: klass.studentCount,
        activeStudentCount: activeStudentIds.size,
        averageScorePct: averagePct(classResults),
        completionPct: classStudents.length
          ? Math.round(byStudent.reduce((sum, value) => sum + value, 0) / classStudents.length)
          : 0,
        lastActivityAt: latestTimestamp(classResults),
      };
    })
    .sort((left, right) => {
      const rightAvg = right.averageScorePct ?? -1;
      const leftAvg = left.averageScorePct ?? -1;
      if (rightAvg !== leftAvg) return rightAvg - leftAvg;
      return left.name.localeCompare(right.name);
    });

  const attentionStudents = input.students
    .map((student) => {
      const classResults = windowResults.filter((row) => row.classId === student.classId);
      const ownRows = classResults.filter((row) => row.studentId === student.id);
      const classHasOtherActivity = classResults.some((row) => row.studentId !== student.id);
      const reasonCodes = [
        averagePct(ownRows) != null && averagePct(ownRows)! < 75 ? "low_average" : null,
        ownRows.length === 0 && classHasOtherActivity ? "inactive_while_class_active" : null,
        completionPct(ownRows) < 10 ? "low_completion" : null,
      ].filter((value): value is "low_average" | "inactive_while_class_active" | "low_completion" => value !== null);

      return {
        studentId: student.id,
        classId: student.classId,
        className: student.className,
        fullName: student.fullName,
        firstName: student.firstName,
        lastName: student.lastName,
        averageScorePct: averagePct(ownRows),
        completionPct: completionPct(ownRows),
        reasonCodes,
      };
    })
    .filter((row) => row.reasonCodes.length > 0)
    .sort((left, right) => left.fullName.localeCompare(right.fullName));

  const activeClasses = classSummaries
    .filter((row): row is typeof row & { lastActivityAt: string } => row.lastActivityAt !== null)
    .sort((left, right) => right.lastActivityAt.localeCompare(left.lastActivityAt))
    .slice(0, 5)
    .map((row) => ({ classId: row.id, className: row.name, lastActivityAt: row.lastActivityAt }));

  const studentByClassKey = new Map(
    input.students.map((student) => [`${student.classId}:${student.id}`, student] as const),
  );
  const recentPasses = windowResults
    .filter((row) => row.passed)
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
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

  const quietClasses = classSummaries
    .filter((row) => row.lastActivityAt === null)
    .map((row) => ({ classId: row.id, className: row.name, studentCount: row.studentCount }));

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

export function buildTeacherClassReport(
  input: {
    classes: TeacherReportClassRecord[];
    students: TeacherReportStudentRecord[];
    results: TeacherReportGameResultRecord[];
    classId: string;
    windowKey: TeacherReportsWindowKey;
    now?: Date;
  },
): TeacherClassReportPayload {
  const klass = input.classes.find((row) => row.id === input.classId);
  if (!klass) {
    throw new Error("Class not found");
  }

  const window = resolveTeacherReportsWindow(input.windowKey, input.now);
  const classStudents = input.students.filter((student) => student.classId === input.classId);
  const windowResults = input.results.filter((row) =>
    row.classId === input.classId && inWindow(row.completedAt, window.startAt, window.endAt)
  );

  const studentRows = classStudents
    .map((student) => {
      const ownRows = windowResults.filter((row) => row.studentId === student.id);
      const lastPlayed = ownRows.length
        ? [...ownRows].sort((left, right) => left.completedAt.localeCompare(right.completedAt)).at(-1)!
        : null;
      return {
        studentId: student.id,
        fullName: student.fullName,
        firstName: student.firstName,
        lastName: student.lastName,
        averageScorePct: averagePct(ownRows),
        completionPct: completionPct(ownRows),
        lastPlayedPct: lastPlayed?.scorePct ?? null,
        lastActivityAt: lastPlayed?.completedAt ?? null,
      };
    })
    .sort((left, right) => {
      const rightAvg = right.averageScorePct ?? -1;
      const leftAvg = left.averageScorePct ?? -1;
      if (rightAvg !== leftAvg) return rightAvg - leftAvg;
      const leftName = `${left.lastName ?? ""}${left.firstName}`;
      const rightName = `${right.lastName ?? ""}${right.firstName}`;
      return leftName.localeCompare(rightName);
    });

  const topicIds = Array.from(new Set(windowResults.map((row) => row.topicId))).sort();
  const topicBreakdown = topicIds.map((topicId) => {
    const topicRows = windowResults.filter((row) => row.topicId === topicId);
    const gameIds = Array.from(new Set(topicRows.map((row) => row.gameId)))
      .map((gameId) => {
        const rows = topicRows.filter((row) => row.gameId === gameId);
        const example = rows[0];
        const catalogEntry = getGameCatalogEntry(example.topicId, example.gameOrder);
        return {
          gameId,
          gameOrder: example.gameOrder,
          title: catalogEntry?.title ?? gameId,
          averageScorePct: averagePct(rows),
          passCount: rows.filter((row) => row.passed).length,
          attemptCount: rows.length,
          lastPlayedAt: latestTimestamp(rows),
        };
      })
      .sort((left, right) => left.gameOrder - right.gameOrder);

    return {
      topicId,
      averageScorePct: averagePct(topicRows),
      passCount: topicRows.filter((row) => row.passed).length,
      attemptCount: topicRows.length,
      games: gameIds,
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
```

- [ ] **Step 4: Run the shared-report tests**

Run: `deno test src/lib/teacher-reports.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/teacher-reports.ts src/lib/teacher-reports.test.ts
git commit -m "feat: add teacher reports aggregation helpers"
```

### Task 2: Shared Dataset Loader And Reports Overview Endpoint

**Files:**
- Create: `supabase/functions/_shared/teacher_reports.ts`
- Create: `supabase/functions/reports-overview/handler.ts`
- Create: `supabase/functions/reports-overview/handler_test.ts`
- Create: `supabase/functions/reports-overview/index.ts`

**Interfaces:**
- Consumes: `adminClient` and `getAuthedProfile` from `supabase/functions/_shared/client.ts`
- Consumes: `buildTeacherReportsOverview` and `coerceTeacherReportsWindowKey` from `src/lib/teacher-reports.ts`
- Produces: `type TeacherReportsDataset = { classes: TeacherReportClassRecord[]; students: TeacherReportStudentRecord[]; results: TeacherReportGameResultRecord[] }`
- Produces: `async function loadTeacherReportsDataset(input: { teacherId: string; classId?: string }): Promise<TeacherReportsDataset>`
- Produces: `function createReportsOverviewHandler(deps?: { getAuthedProfile(req: Request): Promise<AuthedProfile | null>; loadTeacherReportsDataset(input: { teacherId: string }): Promise<TeacherReportsDataset>; now(): Date; }): (req: Request) => Promise<Response>`

- [ ] **Step 1: Write the failing overview-handler tests**

```ts
// supabase/functions/reports-overview/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createReportsOverviewHandler } from "./handler.ts";

Deno.test("reports-overview rejects non-teacher callers", async () => {
  const handler = createReportsOverviewHandler({
    getAuthedProfile: async () => ({
      id: "student-1",
      role: "student",
      full_name: "Student One",
    }),
    loadTeacherReportsDataset: async () => {
      throw new Error("should not load");
    },
    now: () => new Date("2026-07-29T09:00:00.000Z"),
  });

  const response = await handler(new Request("http://local/reports-overview?window=7d"));
  assertEquals(response.status, 403);
  assertEquals(await response.json(), { error: "Only teachers can view reports" });
});

Deno.test("reports-overview returns class summaries, attention students, and recent activity", async () => {
  const handler = createReportsOverviewHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1",
      role: "teacher",
      full_name: "Teacher One",
    }),
    loadTeacherReportsDataset: async () => ({
      classes: [{ id: "class-a", name: "Class A", joinCode: "AAA111", studentCount: 1 }],
      students: [
        {
          id: "student-1",
          classId: "class-a",
          className: "Class A",
          fullName: "Maria Santos",
          firstName: "Maria",
          lastName: "Santos",
          joinedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      results: [
        {
          studentId: "student-1",
          classId: "class-a",
          topicId: "colors",
          gameId: "colors:0",
          gameOrder: 0,
          score: 0,
          maxScore: 1,
          scorePct: 0,
          passed: false,
          completedAt: "2026-07-28T08:00:00.000Z",
        },
      ],
    }),
    now: () => new Date("2026-07-29T09:00:00.000Z"),
  });

  const response = await handler(new Request("http://local/reports-overview?window=7d"));
  const json = await response.json();

  assertEquals(response.status, 200);
  assertEquals(json.windowKey, "7d");
  assertEquals(json.classSummaries[0].id, "class-a");
  assertEquals(json.attentionStudents[0].reasonCodes, [
    "low_average",
    "low_completion",
  ]);
  assertEquals(json.recentActivity.activeClasses[0].classId, "class-a");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test supabase/functions/reports-overview/handler_test.ts`
Expected: FAIL with `Module not found` for `supabase/functions/reports-overview/handler.ts`.

- [ ] **Step 3: Implement the shared loader and overview handler**

```ts
// supabase/functions/_shared/teacher_reports.ts
import { adminClient } from "./client.ts";
import type {
  TeacherReportClassRecord,
  TeacherReportGameResultRecord,
  TeacherReportStudentRecord,
} from "../../../src/lib/teacher-reports.ts";

type ClassRow = {
  id: string;
  name: string;
  join_code: string;
};

type EnrollmentRow = {
  class_id: string;
  student_id: string;
  joined_at: string;
  classes: { id: string; name: string } | { id: string; name: string }[] | null;
  profiles:
    | { id: string; full_name: string; first_name: string | null; last_name: string | null }
    | { id: string; full_name: string; first_name: string | null; last_name: string | null }[]
    | null;
};

type ResultRow = {
  student_id: string;
  topic_id: string;
  game_id: string;
  game_order: number;
  score: number;
  max_score: number;
  score_pct: number;
  passed: boolean;
  completed_at: string;
};

export type TeacherReportsDataset = {
  classes: TeacherReportClassRecord[];
  students: TeacherReportStudentRecord[];
  results: TeacherReportGameResultRecord[];
};

export async function loadTeacherReportsDataset(
  input: { teacherId: string; classId?: string },
): Promise<TeacherReportsDataset> {
  const classesQuery = adminClient
    .from("classes")
    .select("id, name, join_code")
    .eq("teacher_id", input.teacherId);

  if (input.classId) {
    classesQuery.eq("id", input.classId);
  }

  const { data: classRows, error: classError } = await classesQuery;
  if (classError) throw classError;

  const classes = ((classRows ?? []) as ClassRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    studentCount: 0,
  }));

  if (!classes.length) {
    return { classes: [], students: [], results: [] };
  }

  const classIds = classes.map((row) => row.id);
  const { data: enrollmentRows, error: enrollmentError } = await adminClient
    .from("class_students")
    .select("class_id, student_id, joined_at, classes(id, name), profiles(id, full_name, first_name, last_name)")
    .in("class_id", classIds);

  if (enrollmentError) throw enrollmentError;

  const students = ((enrollmentRows ?? []) as EnrollmentRow[]).flatMap((row) => {
    const klass = Array.isArray(row.classes) ? row.classes[0] : row.classes;
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!klass || !profile) return [];
    return [{
      id: profile.id,
      classId: row.class_id,
      className: klass.name,
      fullName: profile.full_name,
      firstName: profile.first_name ?? profile.full_name,
      lastName: profile.last_name ?? null,
      joinedAt: row.joined_at,
    }];
  });

  const studentIds = Array.from(new Set(students.map((row) => row.id)));
  const classIdsByStudentId = new Map<string, string[]>();
  for (const student of students) {
    const current = classIdsByStudentId.get(student.id) ?? [];
    current.push(student.classId);
    classIdsByStudentId.set(student.id, current);
  }

  const { data: resultRows, error: resultError } = studentIds.length
    ? await adminClient
        .from("attempt_game_results")
        .select("student_id, topic_id, game_id, game_order, score, max_score, score_pct, passed, completed_at")
        .in("student_id", studentIds)
    : { data: [], error: null };

  if (resultError) throw resultError;

  const results = ((resultRows ?? []) as ResultRow[]).flatMap((row) => {
    const classIds = classIdsByStudentId.get(row.student_id) ?? [];
    return classIds.map((classId) => ({
      studentId: row.student_id,
      classId,
      topicId: row.topic_id,
      gameId: row.game_id,
      gameOrder: row.game_order,
      score: row.score,
      maxScore: row.max_score,
      scorePct: row.score_pct,
      passed: row.passed,
      completedAt: row.completed_at,
    }));
  });

  const classCounts = new Map<string, number>();
  for (const student of students) {
    classCounts.set(student.classId, (classCounts.get(student.classId) ?? 0) + 1);
  }

  return {
    classes: classes.map((klass) => ({
      ...klass,
      studentCount: classCounts.get(klass.id) ?? 0,
    })),
    students,
    results,
  };
}
```

```ts
// supabase/functions/reports-overview/handler.ts
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import {
  buildTeacherReportsOverview,
  coerceTeacherReportsWindowKey,
} from "../../../src/lib/teacher-reports.ts";
import { loadTeacherReportsDataset, type TeacherReportsDataset } from "../_shared/teacher_reports.ts";

export function createReportsOverviewHandler(
  deps: {
    getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
    loadTeacherReportsDataset(input: { teacherId: string }): Promise<TeacherReportsDataset>;
    now(): Date;
  } = {
    async getAuthedProfile(req) {
      const { getAuthedProfile } = await import("../_shared/client.ts");
      return getAuthedProfile(req);
    },
    loadTeacherReportsDataset,
    now: () => new Date(),
  },
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "GET") {
      return errorResponse("Method not allowed", 405);
    }

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can view reports", 403);

      const windowKey = coerceTeacherReportsWindowKey(
        new URL(req.url).searchParams.get("window"),
      );
      const dataset = await deps.loadTeacherReportsDataset({ teacherId: profile.id });

      return jsonResponse(
        buildTeacherReportsOverview({
          ...dataset,
          windowKey,
          now: deps.now(),
        }),
      );
    } catch (error) {
      console.error("reports-overview failed", error);
      return errorResponse("We couldn't load teacher reports right now.", 500);
    }
  };
}
```

```ts
// supabase/functions/reports-overview/index.ts
import { createReportsOverviewHandler } from "./handler.ts";

Deno.serve(createReportsOverviewHandler());
```

- [ ] **Step 4: Run the overview tests**

Run: `deno test supabase/functions/reports-overview/handler_test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/teacher_reports.ts supabase/functions/reports-overview/handler.ts supabase/functions/reports-overview/handler_test.ts supabase/functions/reports-overview/index.ts
git commit -m "feat: add teacher reports overview endpoint"
```

### Task 3: Class-Detail Endpoint And Client-Side PDF Export

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `supabase/functions/reports-class/handler.ts`
- Create: `supabase/functions/reports-class/handler_test.ts`
- Create: `supabase/functions/reports-class/index.ts`
- Create: `src/lib/teacher-reports-pdf.ts`
- Create: `src/lib/teacher-reports-pdf.test.ts`

**Interfaces:**
- Consumes: `buildTeacherClassReport` and `coerceTeacherReportsWindowKey` from `src/lib/teacher-reports.ts`
- Consumes: `loadTeacherReportsDataset` from `supabase/functions/_shared/teacher_reports.ts`
- Produces: `function createReportsClassHandler(deps?: { getAuthedProfile(req: Request): Promise<AuthedProfile | null>; loadTeacherReportsDataset(input: { teacherId: string; classId: string }): Promise<TeacherReportsDataset>; now(): Date; }): (req: Request) => Promise<Response>`
- Produces: `type TeacherClassReportPdfModel = { filename: string; title: string; subtitle: string; generatedAt: string; studentRows: string[][]; topicRows: string[][] }`
- Produces: `function buildTeacherClassReportPdfModel(report: TeacherClassReportPayload): TeacherClassReportPdfModel`
- Produces: `async function downloadTeacherClassReportPdf(report: TeacherClassReportPayload): Promise<void>`

- [ ] **Step 1: Write the failing class-handler and PDF-model tests**

```ts
// supabase/functions/reports-class/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createReportsClassHandler } from "./handler.ts";

Deno.test("reports-class returns 404 when the class is not owned by the teacher", async () => {
  const handler = createReportsClassHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1",
      role: "teacher",
      full_name: "Teacher One",
    }),
    loadTeacherReportsDataset: async () => ({
      classes: [],
      students: [],
      results: [],
    }),
    now: () => new Date("2026-07-29T09:00:00.000Z"),
  });

  const response = await handler(new Request("http://local/reports-class?classId=class-a&window=7d"));
  assertEquals(response.status, 404);
  assertEquals(await response.json(), { error: "Class not found" });
});

Deno.test("reports-class returns an honest no-data payload for empty windows", async () => {
  const handler = createReportsClassHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1",
      role: "teacher",
      full_name: "Teacher One",
    }),
    loadTeacherReportsDataset: async () => ({
      classes: [{ id: "class-a", name: "Class A", joinCode: "AAA111", studentCount: 1 }],
      students: [
        {
          id: "student-1",
          classId: "class-a",
          className: "Class A",
          fullName: "Maria Santos",
          firstName: "Maria",
          lastName: "Santos",
          joinedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      results: [],
    }),
    now: () => new Date("2026-07-29T09:00:00.000Z"),
  });

  const response = await handler(new Request("http://local/reports-class?classId=class-a&window=7d"));
  const json = await response.json();

  assertEquals(response.status, 200);
  assertEquals(json.hasData, false);
  assertEquals(json.studentRows[0].averageScorePct, null);
  assertEquals(json.topicBreakdown, []);
});
```

```ts
// src/lib/teacher-reports-pdf.test.ts
import { assertEquals } from "jsr:@std/assert";
import { buildTeacherClassReportPdfModel } from "./teacher-reports-pdf.ts";

Deno.test("buildTeacherClassReportPdfModel derives filename and rows from the class payload", () => {
  const model = buildTeacherClassReportPdfModel({
    windowKey: "30d",
    windowLabel: "Last 30 days",
    hasData: true,
    classSummary: {
      id: "class-a",
      name: "Class A",
      joinCode: "AAA111",
      studentCount: 1,
    },
    studentRows: [
      {
        studentId: "student-1",
        fullName: "Maria Santos",
        firstName: "Maria",
        lastName: "Santos",
        averageScorePct: 80,
        completionPct: 12,
        lastPlayedPct: 100,
        lastActivityAt: "2026-07-28T08:00:00.000Z",
      },
    ],
    topicBreakdown: [
      {
        topicId: "colors",
        averageScorePct: 80,
        passCount: 1,
        attemptCount: 1,
        games: [
          {
            gameId: "colors:0",
            gameOrder: 0,
            title: "colors-1",
            averageScorePct: 100,
            passCount: 1,
            attemptCount: 1,
            lastPlayedAt: "2026-07-28T08:00:00.000Z",
          },
        ],
      },
    ],
  });

  assertEquals(model.filename, "class-a-last-30-days-report.pdf");
  assertEquals(model.studentRows[0], ["Santos", "Maria", "80%", "12%", "100%", "2026-07-28"]);
  assertEquals(model.topicRows[0], ["colors", "80%", "1", "1"]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test supabase/functions/reports-class/handler_test.ts src/lib/teacher-reports-pdf.test.ts`
Expected: FAIL with `Module not found` for `reports-class/handler.ts` and `teacher-reports-pdf.ts`.

- [ ] **Step 3: Install PDF dependencies**

```bash
npm install jspdf jspdf-autotable
```

Expected files changed: `package.json`, `package-lock.json`

- [ ] **Step 4: Implement the class endpoint and PDF helper**

```ts
// supabase/functions/reports-class/handler.ts
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import {
  buildTeacherClassReport,
  coerceTeacherReportsWindowKey,
} from "../../../src/lib/teacher-reports.ts";
import { loadTeacherReportsDataset, type TeacherReportsDataset } from "../_shared/teacher_reports.ts";

export function createReportsClassHandler(
  deps: {
    getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
    loadTeacherReportsDataset(input: { teacherId: string; classId: string }): Promise<TeacherReportsDataset>;
    now(): Date;
  } = {
    async getAuthedProfile(req) {
      const { getAuthedProfile } = await import("../_shared/client.ts");
      return getAuthedProfile(req);
    },
    loadTeacherReportsDataset,
    now: () => new Date(),
  },
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "GET") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can view reports", 403);

      const url = new URL(req.url);
      const classId = url.searchParams.get("classId");
      if (!classId) return errorResponse("classId is required", 422);

      const dataset = await deps.loadTeacherReportsDataset({ teacherId: profile.id, classId });
      if (!dataset.classes.length) return errorResponse("Class not found", 404);

      return jsonResponse(
        buildTeacherClassReport({
          ...dataset,
          classId,
          windowKey: coerceTeacherReportsWindowKey(url.searchParams.get("window")),
          now: deps.now(),
        }),
      );
    } catch (error) {
      console.error("reports-class failed", error);
      return errorResponse("We couldn't load that class report right now.", 500);
    }
  };
}
```

```ts
// supabase/functions/reports-class/index.ts
import { createReportsClassHandler } from "./handler.ts";

Deno.serve(createReportsClassHandler());
```

```ts
// src/lib/teacher-reports-pdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { TeacherClassReportPayload } from "./teacher-reports.ts";

export type TeacherClassReportPdfModel = {
  filename: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  studentRows: string[][];
  topicRows: string[][];
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatPct(value: number | null): string {
  return value == null ? "--" : `${value}%`;
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "--";
}

export function buildTeacherClassReportPdfModel(
  report: TeacherClassReportPayload,
): TeacherClassReportPdfModel {
  return {
    filename: `${slugify(report.classSummary.name)}-${slugify(report.windowLabel)}-report.pdf`,
    title: `${report.classSummary.name} Report`,
    subtitle: `${report.windowLabel} | Code ${report.classSummary.joinCode}`,
    generatedAt: new Date().toISOString().slice(0, 10),
    studentRows: report.studentRows.map((row) => [
      row.lastName ?? "--",
      row.firstName,
      formatPct(row.averageScorePct),
      formatPct(row.completionPct),
      formatPct(row.lastPlayedPct),
      formatDate(row.lastActivityAt),
    ]),
    topicRows: report.topicBreakdown.map((row) => [
      row.topicId,
      formatPct(row.averageScorePct),
      String(row.passCount),
      String(row.attemptCount),
    ]),
  };
}

export async function downloadTeacherClassReportPdf(
  report: TeacherClassReportPayload,
): Promise<void> {
  const model = buildTeacherClassReportPdfModel(report);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  pdf.setFontSize(18);
  pdf.text(model.title, 40, 48);
  pdf.setFontSize(11);
  pdf.text(model.subtitle, 40, 68);
  pdf.text(`Generated ${model.generatedAt}`, 40, 84);

  autoTable(pdf, {
    startY: 108,
    head: [["Last Name", "First Name", "Avg Score", "Completion", "Last Played", "Last Activity"]],
    body: model.studentRows,
  });

  autoTable(pdf, {
    startY: (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? ((pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24)
      : 320,
    head: [["Topic", "Avg Score", "Passes", "Attempts"]],
    body: model.topicRows,
  });

  pdf.save(model.filename);
}
```

- [ ] **Step 5: Run the class and PDF tests, then typecheck**

Run: `deno test supabase/functions/reports-class/handler_test.ts src/lib/teacher-reports-pdf.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json supabase/functions/reports-class/handler.ts supabase/functions/reports-class/handler_test.ts supabase/functions/reports-class/index.ts src/lib/teacher-reports-pdf.ts src/lib/teacher-reports-pdf.test.ts
git commit -m "feat: add teacher class reports and pdf export helper"
```

### Task 4: Client Contracts, Hooks, And Reports Route Activation

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/lib/hooks.ts`
- Modify: `src/lib/teacher-nav.ts`
- Modify: `src/lib/teacher-nav.test.ts`

**Interfaces:**
- Consumes: `TeacherReportsOverviewPayload`, `TeacherClassReportPayload`, and `TeacherReportsWindowKey` from `src/lib/teacher-reports.ts`
- Produces: `api.reports.overview(window: TeacherReportsWindowKey): Promise<TeacherReportsOverviewPayload>`
- Produces: `api.reports.classDetail(classId: string, window: TeacherReportsWindowKey): Promise<TeacherClassReportPayload>`
- Produces: `useTeacherReportsOverview(window: TeacherReportsWindowKey)`
- Produces: `useTeacherClassReport(classId: string, window: TeacherReportsWindowKey)`
- Produces: `isTeacherNavActive("/teacher/reports/classes/:classId", "/teacher/reports") === true`

- [ ] **Step 1: Write the failing nav regression test**

```ts
// src/lib/teacher-nav.test.ts
import { assertEquals } from "jsr:@std/assert";
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from "./teacher-nav.ts";

Deno.test("teacher nav exposes the approved classes, reports, and settings routes", () => {
  assertEquals(TEACHER_NAV_ITEMS, [
    { href: "/teacher", labelKey: "teacher.classes" },
    { href: "/teacher/reports", labelKey: "teacher.reports" },
    { href: "/teacher/settings", labelKey: "teacher.settings" },
  ]);
});

Deno.test("teacher nav keeps reports active for class report drill-down routes", () => {
  assertEquals(isTeacherNavActive("/teacher/classes/class-1", "/teacher"), true);
  assertEquals(isTeacherNavActive("/teacher/reports?window=30d", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/reports/classes/class-1", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/settings", "/teacher/reports"), false);
});
```

- [ ] **Step 2: Run the nav test to verify it fails**

Run: `deno test src/lib/teacher-nav.test.ts`
Expected: FAIL because `/teacher/reports/classes/class-1` is not treated as active for `/teacher/reports`.

- [ ] **Step 3: Implement the report client contracts and nav update**

```ts
// src/lib/api.ts
import type {
  TeacherClassReportPayload,
  TeacherReportsOverviewPayload,
  TeacherReportsWindowKey,
} from "./teacher-reports";

export const api = {
  // existing groups...
  reports: {
    overview: (window: TeacherReportsWindowKey) =>
      invokeFunction<TeacherReportsOverviewPayload>("reports-overview", {
        searchParams: { window },
      }),
    classDetail: (classId: string, window: TeacherReportsWindowKey) =>
      invokeFunction<TeacherClassReportPayload>("reports-class", {
        searchParams: { classId, window },
      }),
  },
};
```

```ts
// src/lib/hooks.ts
import type { TeacherReportsWindowKey } from "./teacher-reports";

export function useTeacherReportsOverview(window: TeacherReportsWindowKey) {
  return useQuery({
    queryKey: ["teacher-reports", "overview", window],
    queryFn: () => api.reports.overview(window),
  });
}

export function useTeacherClassReport(classId: string, window: TeacherReportsWindowKey) {
  return useQuery({
    queryKey: ["teacher-reports", "class", classId, window],
    queryFn: () => api.reports.classDetail(classId, window),
    enabled: !!classId,
  });
}
```

```ts
// src/lib/teacher-nav.ts
export const TEACHER_NAV_ITEMS = [
  { href: "/teacher", labelKey: "teacher.classes" },
  { href: "/teacher/reports", labelKey: "teacher.reports" },
  { href: "/teacher/settings", labelKey: "teacher.settings" },
] as const;

export function isTeacherNavActive(pathname: string, href: string): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0];

  if (href === "/teacher") {
    return cleanPath === "/teacher"
      || cleanPath === "/teacher/classes"
      || cleanPath.startsWith("/teacher/classes/");
  }

  if (href === "/teacher/reports") {
    return cleanPath === "/teacher/reports"
      || cleanPath.startsWith("/teacher/reports/");
  }

  return cleanPath === href;
}
```

- [ ] **Step 4: Run the nav test, shared tests, and typecheck**

Run: `deno test src/lib/teacher-nav.test.ts src/lib/teacher-reports.test.ts src/lib/teacher-reports-pdf.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/lib/hooks.ts src/lib/teacher-nav.ts src/lib/teacher-nav.test.ts
git commit -m "feat: add teacher reports client contracts"
```

### Task 5: Reports Overview Page And Cross-Class Sections

**Files:**
- Create: `src/components/teacher/reports/TeacherReportsWindowPicker.tsx`
- Create: `src/components/teacher/reports/TeacherReportsClassComparison.tsx`
- Create: `src/components/teacher/reports/TeacherReportsAttentionList.tsx`
- Create: `src/components/teacher/reports/TeacherReportsRecentActivity.tsx`
- Modify: `src/pages/teacher.tsx`

**Interfaces:**
- Consumes: `useTeacherReportsOverview` from `src/lib/hooks.ts`
- Consumes: `parseTeacherReportsWindow` from `src/lib/teacher-reports.ts`
- Produces: `TeacherReportsOverviewPage(): JSX.Element`
- Produces: `TeacherReportsWindowPicker(props: { value: TeacherReportsWindowKey; onChange(window: TeacherReportsWindowKey): void }): JSX.Element`
- Produces: `TeacherReportsClassComparison(props: { rows: TeacherReportsOverviewPayload["classSummaries"]; onOpenClass(classId: string): void }): JSX.Element`
- Produces: `TeacherReportsAttentionList(props: { rows: TeacherReportsOverviewPayload["attentionStudents"]; onOpenClass(classId: string): void }): JSX.Element`
- Produces: `TeacherReportsRecentActivity(props: { data: TeacherReportsOverviewPayload["recentActivity"] }): JSX.Element`

- [ ] **Step 1: Write the failing overview page integration**

```tsx
// src/pages/teacher.tsx
import { TeacherReportsWindowPicker } from "@/components/teacher/reports/TeacherReportsWindowPicker";
import { TeacherReportsClassComparison } from "@/components/teacher/reports/TeacherReportsClassComparison";
import { TeacherReportsAttentionList } from "@/components/teacher/reports/TeacherReportsAttentionList";
import { TeacherReportsRecentActivity } from "@/components/teacher/reports/TeacherReportsRecentActivity";
import { useTeacherReportsOverview } from "@/lib/hooks";
import { parseTeacherReportsWindow, type TeacherReportsWindowKey } from "@/lib/teacher-reports";

export function TeacherReportsOverviewPage() {
  const [location, setLocation] = useLocation();
  const windowKey = React.useMemo(
    () => parseTeacherReportsWindow(window.location.search),
    [location],
  );
  const { data, isLoading, error } = useTeacherReportsOverview(windowKey);

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">Reports</h1>
          <p className="mt-2 font-bold text-muted-foreground">
            Compare classes, find students who need attention, and drill into class reports.
          </p>
        </>
      )}
    >
      <TeacherReportsWindowPicker
        value={windowKey}
        onChange={(nextWindow) => setLocation(`/teacher/reports?window=${nextWindow}`)}
      />
    </TeacherWorkspaceBoard>
  );
}
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`
Expected: FAIL with `Cannot find module '@/components/teacher/reports/TeacherReportsWindowPicker'` and missing `useTeacherReportsOverview`.

- [ ] **Step 3: Implement the overview components and replace the placeholder**

```tsx
// src/components/teacher/reports/TeacherReportsWindowPicker.tsx
import { Button } from "@/components/ui";
import type { TeacherReportsWindowKey } from "@/lib/teacher-reports";

const WINDOWS: { value: TeacherReportsWindowKey; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "quarter", label: "This quarter" },
  { value: "all", label: "All time" },
];

export function TeacherReportsWindowPicker({
  value,
  onChange,
}: {
  value: TeacherReportsWindowKey;
  onChange(window: TeacherReportsWindowKey): void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {WINDOWS.map((window) => (
        <Button
          key={window.value}
          variant={window.value === value ? "default" : "outline"}
          onClick={() => onChange(window.value)}
        >
          {window.label}
        </Button>
      ))}
    </div>
  );
}
```

```tsx
// src/components/teacher/reports/TeacherReportsClassComparison.tsx
import { Button, Card } from "@/components/ui";
import type { TeacherReportsOverviewPayload } from "@/lib/teacher-reports";

function formatPct(value: number | null) {
  return value == null ? "--" : `${value}%`;
}

export function TeacherReportsClassComparison({
  rows,
  onOpenClass,
}: {
  rows: TeacherReportsOverviewPayload["classSummaries"];
  onOpenClass(classId: string): void;
}) {
  return (
    <Card className="rounded-[24px] p-0 overflow-hidden">
      <div className="border-b border-border/60 px-6 py-4">
        <h2 className="text-2xl font-display font-bold">Class Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-border bg-muted/40">
              <th className="p-4 font-bold text-muted-foreground">Class</th>
              <th className="p-4 font-bold text-muted-foreground">Students</th>
              <th className="p-4 font-bold text-muted-foreground">Active</th>
              <th className="p-4 font-bold text-muted-foreground">Avg Score</th>
              <th className="p-4 font-bold text-muted-foreground">Completion</th>
              <th className="p-4 font-bold text-muted-foreground">Last Activity</th>
              <th className="p-4 font-bold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60">
                <td className="p-4 font-bold">{row.name}</td>
                <td className="p-4 font-bold">{row.studentCount}</td>
                <td className="p-4 font-bold">{row.activeStudentCount}</td>
                <td className="p-4 font-bold">{formatPct(row.averageScorePct)}</td>
                <td className="p-4 font-bold">{formatPct(row.completionPct)}</td>
                <td className="p-4 font-bold">{row.lastActivityAt?.slice(0, 10) ?? "--"}</td>
                <td className="p-4">
                  <Button size="sm" onClick={() => onOpenClass(row.id)}>
                    View class report
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
```

```tsx
// src/components/teacher/reports/TeacherReportsAttentionList.tsx
import { Button, Card } from "@/components/ui";
import type { TeacherReportsOverviewPayload } from "@/lib/teacher-reports";

const ATTENTION_LABELS = {
  low_average: "Average score below 75%",
  inactive_while_class_active: "No recent activity while classmates are active",
  low_completion: "Completion below 10%",
} as const;

export function TeacherReportsAttentionList({
  rows,
  onOpenClass,
}: {
  rows: TeacherReportsOverviewPayload["attentionStudents"];
  onOpenClass(classId: string): void;
}) {
  return (
    <Card className="rounded-[24px] p-6">
      <h2 className="text-2xl font-display font-bold">Students Needing Attention</h2>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 && (
          <p className="font-bold text-muted-foreground">
            No students are currently flagged in this window.
          </p>
        )}
        {rows.map((row) => (
          <div key={`${row.classId}-${row.studentId}`} className="rounded-2xl border border-border/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-display text-lg font-bold">{row.fullName}</p>
                <p className="text-sm font-bold text-muted-foreground">{row.className}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {row.reasonCodes.map((reason) => (
                    <span key={reason} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                      {ATTENTION_LABELS[reason]}
                    </span>
                  ))}
                </div>
              </div>
              <Button size="sm" onClick={() => onOpenClass(row.classId)}>
                Open class report
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

```tsx
// src/components/teacher/reports/TeacherReportsRecentActivity.tsx
import { Card } from "@/components/ui";
import type { TeacherReportsOverviewPayload } from "@/lib/teacher-reports";

export function TeacherReportsRecentActivity({
  data,
}: {
  data: TeacherReportsOverviewPayload["recentActivity"];
}) {
  return (
    <Card className="rounded-[24px] p-6">
      <h2 className="text-2xl font-display font-bold">Recent Activity</h2>
      <div className="mt-4 grid gap-6 xl:grid-cols-3">
        <div>
          <h3 className="font-bold text-muted-foreground">Recently active classes</h3>
          <ul className="mt-3 grid gap-2">
            {data.activeClasses.map((row) => (
              <li key={row.classId} className="rounded-2xl border border-border/60 p-3 font-bold">
                {row.className} | {row.lastActivityAt.slice(0, 10)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-muted-foreground">Recent passes</h3>
          <ul className="mt-3 grid gap-2">
            {data.recentPasses.map((row) => (
              <li key={`${row.classId}-${row.studentId}-${row.gameId}-${row.completedAt}`} className="rounded-2xl border border-border/60 p-3 font-bold">
                {row.fullName} | {row.className} | {row.scorePct}%
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-muted-foreground">Quiet classes</h3>
          <ul className="mt-3 grid gap-2">
            {data.quietClasses.map((row) => (
              <li key={row.classId} className="rounded-2xl border border-border/60 p-3 font-bold">
                {row.className} | {row.studentCount} students
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
```

```tsx
// src/pages/teacher.tsx
export function TeacherReportsOverviewPage() {
  const [location, setLocation] = useLocation();
  const windowKey = React.useMemo(
    () => parseTeacherReportsWindow(window.location.search),
    [location],
  );
  const { data, isLoading, error } = useTeacherReportsOverview(windowKey);

  if (isLoading) {
    return <div className="p-8 text-center font-bold">Loading reports...</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">Reports</h1>
          <p className="mt-2 font-bold text-muted-foreground">
            Compare classes, find students who need attention, and open class reports.
          </p>
        </>
      )}
    >
      <TeacherReportsWindowPicker
        value={windowKey}
        onChange={(nextWindow) => setLocation(`/teacher/reports?window=${nextWindow}`)}
      />

      {error && (
        <Card className="mb-6 rounded-[24px] p-6 font-bold text-destructive">
          {(error as Error).message || "We couldn't load reports right now."}
        </Card>
      )}

      {data && (
        <div className="grid gap-6">
          <TeacherReportsClassComparison
            rows={data.classSummaries}
            onOpenClass={(classId) => setLocation(`/teacher/reports/classes/${classId}?window=${windowKey}`)}
          />
          <TeacherReportsAttentionList
            rows={data.attentionStudents}
            onOpenClass={(classId) => setLocation(`/teacher/reports/classes/${classId}?window=${windowKey}`)}
          />
          <TeacherReportsRecentActivity data={data.recentActivity} />
          <Card className="rounded-[24px] p-6 font-bold text-muted-foreground">
            PDF export is available from each class report.
          </Card>
        </div>
      )}
    </TeacherWorkspaceBoard>
  );
}
```

- [ ] **Step 4: Run typecheck and the shared Deno tests**

Run: `npm run typecheck`
Expected: PASS

Run: `deno test src/lib/teacher-reports.test.ts src/lib/teacher-nav.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/teacher/reports/TeacherReportsWindowPicker.tsx src/components/teacher/reports/TeacherReportsClassComparison.tsx src/components/teacher/reports/TeacherReportsAttentionList.tsx src/components/teacher/reports/TeacherReportsRecentActivity.tsx src/pages/teacher.tsx
git commit -m "feat: add teacher reports overview page"
```

### Task 6: Class Report Page, Routing, And Final Verification

**Files:**
- Create: `src/components/teacher/reports/TeacherClassReportStudentTable.tsx`
- Create: `src/components/teacher/reports/TeacherClassReportTopicBreakdown.tsx`
- Create: `src/components/teacher/reports/TeacherClassReportPdfButton.tsx`
- Modify: `src/pages/teacher.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useTeacherClassReport` from `src/lib/hooks.ts`
- Consumes: `downloadTeacherClassReportPdf` from `src/lib/teacher-reports-pdf.ts`
- Produces: `TeacherClassReportPage(props: { classId: string }): JSX.Element`
- Produces: `TeacherClassReportStudentTable(props: { rows: TeacherClassReportPayload["studentRows"] }): JSX.Element`
- Produces: `TeacherClassReportTopicBreakdown(props: { rows: TeacherClassReportPayload["topicBreakdown"] }): JSX.Element`
- Produces: `TeacherClassReportPdfButton(props: { report: TeacherClassReportPayload; disabled: boolean }): JSX.Element`

- [ ] **Step 1: Write the failing class-report route wiring**

```tsx
// src/App.tsx
import {
  TeacherClassesHome,
  TeacherClassWorkspace,
  TeacherReportsOverviewPage,
  TeacherClassReportPage,
  TeacherSettingsPlaceholder,
} from "@/pages/teacher";

<Route path="/teacher/reports/classes/:classId">
  {params => <AppLayout sidebarMode="hidden"><TeacherClassReportPage classId={params.classId} /></AppLayout>}
</Route>
<Route path="/teacher/reports">
  {() => <AppLayout sidebarMode="hidden"><TeacherReportsOverviewPage /></AppLayout>}
</Route>
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`
Expected: FAIL with `TeacherClassReportPage` and class-report components missing.

- [ ] **Step 3: Implement the class page, tables, and PDF button**

```tsx
// src/components/teacher/reports/TeacherClassReportStudentTable.tsx
import { useMemo, useState } from "react";
import type { TeacherClassReportPayload } from "@/lib/teacher-reports";

function formatPct(value: number | null) {
  return value == null ? "--" : `${value}%`;
}

type SortKey = "lastName" | "averageScorePct" | "completionPct" | "lastPlayedPct";

export function TeacherClassReportStudentTable({
  rows,
}: {
  rows: TeacherClassReportPayload["studentRows"];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("averageScorePct");
  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      if (sortKey === "lastName") {
        return `${left.lastName ?? ""}${left.firstName}`.localeCompare(`${right.lastName ?? ""}${right.firstName}`);
      }
      return (right[sortKey] ?? -1) - (left[sortKey] ?? -1);
    });
  }, [rows, sortKey]);

  return (
    <div className="overflow-x-auto rounded-[24px] border-2 border-border bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-border bg-muted/40">
            <th className="p-4 font-bold text-muted-foreground">
              <button type="button" onClick={() => setSortKey("lastName")}>Last Name</button>
            </th>
            <th className="p-4 font-bold text-muted-foreground">First Name</th>
            <th className="p-4 font-bold text-muted-foreground">
              <button type="button" onClick={() => setSortKey("averageScorePct")}>Avg Score</button>
            </th>
            <th className="p-4 font-bold text-muted-foreground">
              <button type="button" onClick={() => setSortKey("completionPct")}>Completion</button>
            </th>
            <th className="p-4 font-bold text-muted-foreground">
              <button type="button" onClick={() => setSortKey("lastPlayedPct")}>Last Played</button>
            </th>
            <th className="p-4 font-bold text-muted-foreground">Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.studentId} className="border-b border-border/60">
              <td className="p-4 font-bold">{row.lastName ?? "--"}</td>
              <td className="p-4 font-bold">{row.firstName}</td>
              <td className="p-4 font-bold">{formatPct(row.averageScorePct)}</td>
              <td className="p-4 font-bold">{formatPct(row.completionPct)}</td>
              <td className="p-4 font-bold">{formatPct(row.lastPlayedPct)}</td>
              <td className="p-4 font-bold">{row.lastActivityAt?.slice(0, 10) ?? "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

```tsx
// src/components/teacher/reports/TeacherClassReportTopicBreakdown.tsx
import { useState } from "react";
import { Card } from "@/components/ui";
import type { TeacherClassReportPayload } from "@/lib/teacher-reports";

function formatPct(value: number | null) {
  return value == null ? "--" : `${value}%`;
}

export function TeacherClassReportTopicBreakdown({
  rows,
}: {
  rows: TeacherClassReportPayload["topicBreakdown"];
}) {
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <Card key={row.topicId} className="rounded-[24px] p-0 overflow-hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between px-6 py-4 text-left"
            onClick={() =>
              setOpenTopics((current) => ({ ...current, [row.topicId]: !current[row.topicId] }))
            }
          >
            <span className="font-display text-xl font-bold">{row.topicId}</span>
            <span className="font-bold text-muted-foreground">
              {formatPct(row.averageScorePct)} | {row.passCount}/{row.attemptCount} passes
            </span>
          </button>
          {openTopics[row.topicId] && (
            <div className="border-t border-border/60 px-6 py-4">
              <div className="grid gap-3">
                {row.games.map((game) => (
                  <div key={game.gameId} className="rounded-2xl border border-border/60 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="font-bold">{game.title}</p>
                      <p className="font-bold text-muted-foreground">
                        {formatPct(game.averageScorePct)} | {game.passCount}/{game.attemptCount} passes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
```

```tsx
// src/components/teacher/reports/TeacherClassReportPdfButton.tsx
import { Button } from "@/components/ui";
import { downloadTeacherClassReportPdf } from "@/lib/teacher-reports-pdf";
import type { TeacherClassReportPayload } from "@/lib/teacher-reports";

export function TeacherClassReportPdfButton({
  report,
  disabled,
}: {
  report: TeacherClassReportPayload;
  disabled: boolean;
}) {
  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={() => downloadTeacherClassReportPdf(report)}
    >
      Export PDF
    </Button>
  );
}
```

```tsx
// src/pages/teacher.tsx
export function TeacherClassReportPage({ classId }: { classId: string }) {
  const [location, setLocation] = useLocation();
  const windowKey = React.useMemo(
    () => parseTeacherReportsWindow(window.location.search),
    [location],
  );
  const { data, isLoading, error } = useTeacherClassReport(classId, windowKey);

  if (isLoading) {
    return <div className="p-8 text-center font-bold">Loading class report...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center font-bold">Class report unavailable.</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">{data.classSummary.name}</h1>
          <p className="mt-2 font-bold text-muted-foreground">
            Code: {data.classSummary.joinCode} | {data.windowLabel}
          </p>
        </>
      )}
      action={<TeacherClassReportPdfButton report={data} disabled={!data.hasData} />}
    >
      <TeacherReportsWindowPicker
        value={windowKey}
        onChange={(nextWindow) => setLocation(`/teacher/reports/classes/${classId}?window=${nextWindow}`)}
      />

      {error && (
        <Card className="mb-6 rounded-[24px] p-6 font-bold text-destructive">
          {(error as Error).message || "We couldn't load this class report right now."}
        </Card>
      )}

      {!data.hasData && (
        <Card className="mb-6 rounded-[24px] p-6 font-bold text-muted-foreground">
          No reportable game results exist for this class in the selected window.
        </Card>
      )}

      <div className="grid gap-6">
        <TeacherClassReportStudentTable rows={data.studentRows} />
        <TeacherClassReportTopicBreakdown rows={data.topicBreakdown} />
      </div>
    </TeacherWorkspaceBoard>
  );
}
```

```tsx
// src/App.tsx
<Route path="/teacher/reports/classes/:classId">
  {params => <AppLayout sidebarMode="hidden"><TeacherClassReportPage classId={params.classId} /></AppLayout>}
</Route>
<Route path="/teacher/reports">
  {() => <AppLayout sidebarMode="hidden"><TeacherReportsOverviewPage /></AppLayout>}
</Route>
```

- [ ] **Step 4: Run final verification**

Run: `deno test src/lib/teacher-reports.test.ts src/lib/teacher-reports-pdf.test.ts src/lib/teacher-nav.test.ts supabase/functions/reports-overview/handler_test.ts supabase/functions/reports-class/handler_test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

Run: `npm run build`
Expected: PASS

Run: `npm run dev`
Expected:
- `/teacher/reports` loads the real reports landing page.
- The selected preset window changes the overview data and stays visible.
- `View class report` opens `/teacher/reports/classes/:classId?window=<selected>`.
- The `Reports` rail item stays active on the class-detail page.
- A class with no data in the selected window shows the honest empty-state card and disables `Export PDF`.
- A class with data can export a PDF with the same class name and window label shown on screen.
- The pages stay full-width inside the teacher board on desktop and remain usable on mobile with stacked sections and scrollable tables.

- [ ] **Step 5: Commit**

```bash
git add src/components/teacher/reports/TeacherClassReportStudentTable.tsx src/components/teacher/reports/TeacherClassReportTopicBreakdown.tsx src/components/teacher/reports/TeacherClassReportPdfButton.tsx src/pages/teacher.tsx src/App.tsx
git commit -m "feat: add teacher report pages"
```
