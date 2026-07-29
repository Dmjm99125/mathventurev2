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

  assertEquals(
    overview.classSummaries.map((row: { id: string }) => row.id),
    ["class-a", "class-b"],
  );
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
