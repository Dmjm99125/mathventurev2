import { assertEquals } from "jsr:@std/assert";
import { createLoadTeacherReportsDataset } from "./teacher_reports.ts";

Deno.test("loadTeacherReportsDataset keeps results on their recorded class and ignores pre-join activity", async () => {
  const loadTeacherReportsDataset = createLoadTeacherReportsDataset({
    listClasses: async () => [
      { id: "class-a", name: "Class A", join_code: "AAA111" },
      { id: "class-b", name: "Class B", join_code: "BBB222" },
    ],
    listEnrollments: async () => [
      {
        class_id: "class-a",
        student_id: "student-1",
        joined_at: "2026-07-10T00:00:00.000Z",
        classes: { id: "class-a", name: "Class A" },
        profiles: {
          id: "student-1",
          full_name: "Maria Santos",
          first_name: "Maria",
          last_name: "Santos",
        },
      },
      {
        class_id: "class-b",
        student_id: "student-1",
        joined_at: "2026-07-20T00:00:00.000Z",
        classes: { id: "class-b", name: "Class B" },
        profiles: {
          id: "student-1",
          full_name: "Maria Santos",
          first_name: "Maria",
          last_name: "Santos",
        },
      },
    ],
    listAttempts: async () => [
      {
        id: "attempt-a",
        student_id: "student-1",
        class_id: "class-a",
      },
      {
        id: "attempt-b",
        student_id: "student-1",
        class_id: "class-b",
      },
      {
        id: "attempt-old",
        student_id: "student-1",
        class_id: "class-a",
      },
      {
        id: "attempt-unscoped",
        student_id: "student-1",
        class_id: null,
      },
    ],
    listResultRows: async () => [
      {
        attempt_id: "attempt-a",
        student_id: "student-1",
        topic_id: "colors",
        game_id: "colors:0",
        game_order: 0,
        score: 1,
        max_score: 1,
        score_pct: 100,
        passed: true,
        completed_at: "2026-07-12T09:00:00.000Z",
      },
      {
        attempt_id: "attempt-b",
        student_id: "student-1",
        topic_id: "colors",
        game_id: "colors:1",
        game_order: 1,
        score: 1,
        max_score: 1,
        score_pct: 100,
        passed: true,
        completed_at: "2026-07-22T09:00:00.000Z",
      },
      {
        attempt_id: "attempt-old",
        student_id: "student-1",
        topic_id: "colors",
        game_id: "colors:2",
        game_order: 2,
        score: 1,
        max_score: 1,
        score_pct: 100,
        passed: true,
        completed_at: "2026-07-05T09:00:00.000Z",
      },
      {
        attempt_id: "attempt-unscoped",
        student_id: "student-1",
        topic_id: "colors",
        game_id: "colors:3",
        game_order: 3,
        score: 1,
        max_score: 1,
        score_pct: 100,
        passed: true,
        completed_at: "2026-07-25T09:00:00.000Z",
      },
    ],
  });

  const dataset = await loadTeacherReportsDataset({ teacherId: "teacher-1" });

  assertEquals(dataset.classes, [
    { id: "class-a", name: "Class A", joinCode: "AAA111", studentCount: 1 },
    { id: "class-b", name: "Class B", joinCode: "BBB222", studentCount: 1 },
  ]);
  assertEquals(
    dataset.results.map((row: (typeof dataset.results)[number]) => ({
      classId: row.classId,
      gameId: row.gameId,
      completedAt: row.completedAt,
    })),
    [
      {
        classId: "class-a",
        gameId: "colors:0",
        completedAt: "2026-07-12T09:00:00.000Z",
      },
      {
        classId: "class-b",
        gameId: "colors:1",
        completedAt: "2026-07-22T09:00:00.000Z",
      },
    ],
  );
});
