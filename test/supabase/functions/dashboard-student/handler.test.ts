import { assertEquals } from "jsr:@std/assert";
import { createDashboardStudentHandler } from "../../../../supabase/functions/dashboard-student/handler.ts";

Deno.test("dashboard-student caps recent attempts returned to the browser", async () => {
  const recentAttempts = Array.from({ length: 25 }, (_, index) => ({
    lessonId: `lesson-${index}`,
    score: 1,
    maxScore: 1,
    completedAt: `2026-09-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
  }));
  const handler = createDashboardStudentHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student" }),
    getAggregate: async () => ({ completedLessons: 25, streakDays: 1, recentAttempts }),
  });

  const response = await handler(new Request("http://local/dashboard-student"));

  assertEquals(response.status, 200);
  assertEquals((await response.json()).recentAttempts.length, 20);
});
