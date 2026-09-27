import { assertEquals } from "jsr:@std/assert";
import { createDashboardTeacherHandler } from "../../../../supabase/functions/dashboard-teacher/handler.ts";

Deno.test("dashboard-teacher rejects non-teacher callers before loading aggregates", async () => {
  let aggregateCalls = 0;
  const handler = createDashboardTeacherHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student" }),
    getAggregate: async () => {
      aggregateCalls += 1;
      throw new Error("should not load");
    },
  });

  const response = await handler(new Request("http://local/dashboard-teacher"));

  assertEquals(response.status, 403);
  assertEquals(aggregateCalls, 0);
});

Deno.test("dashboard-teacher formats the bounded database aggregate", async () => {
  const handler = createDashboardTeacherHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher" }),
    getAggregate: async () => ({
      classCount: 1,
      studentCount: 2,
      classes: [{
        id: "class-1",
        name: "Classroom",
        studentCount: 2,
        attemptCount: 4,
        averageScorePct: 75,
      }],
      strugglingLessons: [],
    }),
  });

  const response = await handler(new Request("http://local/dashboard-teacher"));
  assertEquals(response.status, 200);
  assertEquals((await response.json()).studentCount, 2);
});
