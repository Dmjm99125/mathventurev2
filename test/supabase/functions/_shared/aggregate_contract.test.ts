import { assertEquals, assertThrows } from "jsr:@std/assert";
import {
  parseStudentDashboardAggregate,
  parseTeacherDashboardAggregate,
  parseTeacherReportAggregate,
} from "../../../../supabase/functions/_shared/aggregate_contract.ts";

Deno.test("aggregate parsers reject incomplete database payloads", () => {
  assertThrows(() => parseTeacherDashboardAggregate({ classes: [] }));
  assertThrows(() => parseStudentDashboardAggregate({ recentAttempts: [] }));
  assertThrows(() => parseTeacherReportAggregate({ studentRows: [] }));
});

Deno.test("aggregate parsers preserve nullable scores and page metadata", () => {
  assertEquals(
    parseTeacherDashboardAggregate({
      classCount: 1,
      studentCount: 2,
      classes: [{
        id: "class-1",
        name: "Classroom",
        studentCount: 2,
        attemptCount: 3,
        averageScorePct: null,
      }],
      strugglingLessons: [{
        lessonId: "colors",
        attempts: 3,
        averageScorePct: 67,
      }],
    }).classes[0].averageScorePct,
    null,
  );

  assertEquals(
    parseStudentDashboardAggregate({
      completedLessons: 1,
      streakDays: 2,
      recentAttempts: [{
        lessonId: "colors",
        score: 3,
        maxScore: 4,
        completedAt: "2026-09-27T00:00:00.000Z",
      }],
    }).recentAttempts.length,
    1,
  );

  assertEquals(
    parseTeacherReportAggregate({
      classroom: {
        id: "class-1",
        studentCount: 1,
        activeStudentCount: 0,
        averageScorePct: null,
        completionPct: 0,
        lastActivityAt: null,
      },
      attentionStudents: [],
      recentActivity: {
        recentPasses: [],
        lastPlayedAt: null,
        inactiveStudentCount: 1,
      },
      studentRows: [],
      topicBreakdown: [],
      page: { nextCursor: "cursor", hasMore: true },
    }).page,
    { nextCursor: "cursor", hasMore: true },
  );
});
