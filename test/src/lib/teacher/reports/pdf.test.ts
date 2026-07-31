import { assertEquals } from "jsr:@std/assert";
import { buildTeacherClassReportPdfModel } from "../../../../../src/lib/teacher/reports/pdf.ts";

Deno.test("buildTeacherClassReportPdfModel derives a classroom-only header and rows from the singleton payload", () => {
  const model = buildTeacherClassReportPdfModel({
    windowKey: "30d",
    windowLabel: "Last 30 days",
    hasData: true,
    classroomSummary: {
      id: "classroom-1",
      studentCount: 1,
      activeStudentCount: 1,
      averageScorePct: 80,
      completionPct: 12,
      lastActivityAt: "2026-07-28T08:00:00.000Z",
    },
    attentionStudents: [],
    recentActivity: {
      recentPasses: [],
      lastPlayedAt: "2026-07-28T08:00:00.000Z",
      inactiveStudentCount: 0,
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

  assertEquals(model.filename, "classroom-last-30-days-report.pdf");
  assertEquals(model.title, "Classroom Report");
  assertEquals(model.subtitle, "Last 30 days | 1 student");
  assertEquals(model.studentRows[0], ["Santos", "Maria", "80%", "12%", "100%", "2026-07-28"]);
  assertEquals(model.topicRows[0], ["colors", "80%", "1", "1"]);
});
