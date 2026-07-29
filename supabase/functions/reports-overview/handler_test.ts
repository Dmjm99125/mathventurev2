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
