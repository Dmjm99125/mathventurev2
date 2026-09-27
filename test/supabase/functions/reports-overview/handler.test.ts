import { assertEquals } from "jsr:@std/assert";
import { createReportsOverviewHandler } from "../../../../supabase/functions/reports-overview/handler.ts";

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

Deno.test("reports-overview returns the single-classroom report payload", async () => {
  const handler = createReportsOverviewHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1", role: "teacher", full_name: "Ana Cruz"
    }),
    loadTeacherReportsDataset: async () => ({
      classroom: { id: "classroom-1", studentCount: 1 },
      students: [],
      results: [],
    }),
    now: () => new Date("2026-07-31T00:00:00.000Z"),
  });

  const response = await handler(new Request("http://local/reports-overview?window=7d"));
  assertEquals(response.status, 200);
  assertEquals((await response.json()).classroomSummary.id, "classroom-1");
});

Deno.test("reports-overview requests a bounded aggregate for the selected UTC window", async () => {
  let receivedWindow: { startAt: string | null; endAt: string } | null = null;
  const handler = createReportsOverviewHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1", role: "teacher", full_name: "Ana Cruz"
    }),
    getAggregate: async (input: { startAt: string | null; endAt: string }) => {
      receivedWindow = { startAt: input.startAt, endAt: input.endAt };
      return {
        classroom: {
          id: "classroom-1",
          studentCount: 1,
          activeStudentCount: 0,
          averageScorePct: null,
          completionPct: 0,
          lastActivityAt: null,
        },
        attentionStudents: [],
        recentActivity: { recentPasses: [], lastPlayedAt: null, inactiveStudentCount: 1 },
        studentRows: [],
        topicBreakdown: [],
        page: { nextCursor: null, hasMore: false },
      };
    },
    now: () => new Date("2026-07-31T00:00:00.000Z"),
  } as Parameters<typeof createReportsOverviewHandler>[0]);

  const response = await handler(new Request("http://local/reports-overview?window=7d"));

  assertEquals(response.status, 200);
  assertEquals(receivedWindow, {
    startAt: "2026-07-25T00:00:00.000Z",
    endAt: "2026-07-31T00:00:00.000Z",
  });
  assertEquals((await response.json()).studentRowsPage, { nextCursor: null, hasMore: false });
});
