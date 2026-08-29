import { assertEquals } from "jsr:@std/assert";
import {
  createAssignmentsListHandler,
  type AssignmentsListDeps,
} from "../../../../supabase/functions/assignments-list/handler.ts";

Deno.test("assignments-list keeps duplicate lesson assignments distinct for students", async () => {
  const deps: AssignmentsListDeps = {
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student" }),
    listTeacherAssignments: async () => [],
    listStudentAssignments: async () => [
      { id: "assignment-1", name: "Sequencing Review", lessonId: "sequencing", classId: "class-1", dueAt: null, createdAt: "2026-08-01T00:00:00.000Z" },
      { id: "assignment-2", name: "Sequencing Retake", lessonId: "sequencing", classId: "class-1", dueAt: null, createdAt: "2026-08-02T00:00:00.000Z" },
    ],
    listAttempts: async () => new Map([
      ["assignment-1", { status: "completed", currentGameOrder: 9, score: 7, maxScore: 9 }],
    ]),
  };
  const handler = createAssignmentsListHandler(deps);
  const response = await handler(new Request("http://local/assignments-list"));
  const json = await response.json();

  assertEquals(json.assignments.map((assignment: { id: string; name: string; completed: boolean }) => ({
    id: assignment.id,
    name: assignment.name,
    completed: assignment.completed,
  })), [
    { id: "assignment-1", name: "Sequencing Review", completed: true },
    { id: "assignment-2", name: "Sequencing Retake", completed: false },
  ]);
});
