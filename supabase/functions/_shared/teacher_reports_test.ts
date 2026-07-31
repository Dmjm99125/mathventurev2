import { assertEquals } from "jsr:@std/assert";
import { createLoadTeacherReportsDataset } from "./teacher_reports.ts";

Deno.test("loadTeacherReportsDataset keeps results on their recorded class and ignores pre-join activity", async () => {
  const loadTeacherReportsDataset = createLoadTeacherReportsDataset({
    getClassroom: async () => ({ id: "class-a", name: "Classroom" }),
    listEnrollments: async () => [
      {
        class_id: "class-a",
        student_id: "student-1",
        joined_at: "2026-07-10T00:00:00.000Z",
        classes: { id: "class-a", name: "Classroom" },
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

  assertEquals(dataset.classroom, { id: "class-a", studentCount: 1 });
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
    ],
  );
});
