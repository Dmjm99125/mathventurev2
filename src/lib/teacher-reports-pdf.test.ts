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
