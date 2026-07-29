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
