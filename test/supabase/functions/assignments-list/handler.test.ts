import { assertEquals } from "jsr:@std/assert";
import {
  createAssignmentsListHandler,
  type AssignmentsListDeps,
} from "../../../../supabase/functions/assignments-list/handler.ts";

Deno.test("assignments-list returns bounded page metadata", async () => {
  const handler = createAssignmentsListHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student" }),
    listTeacherAssignments: async () => [],
    listStudentAssignments: async () => ({
      assignments: [{
        id: "assignment-1",
        name: "Colors",
        lessonId: "colors",
        classId: "class-1",
        dueAt: null,
        createdAt: "2026-08-01T00:00:00.000Z",
      }],
      nextCursor: "next-cursor",
      hasMore: true,
    }),
    listAttempts: async () => new Map(),
  } as AssignmentsListDeps);

  const response = await handler(new Request("http://local/assignments-list?pageSize=50"));
  const json = await response.json();

  assertEquals(json.page, { nextCursor: "next-cursor", hasMore: true });
  assertEquals(json.assignments.length, 1);
});

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

Deno.test("assignments-list attaches class assignment scores for teacher pages", async () => {
  const handler = createAssignmentsListHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher" }),
    getTeacherClass: async () => ({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Classroom",
      createdAt: "2026-08-01T00:00:00.000Z",
      archivedAt: null,
    }),
    listTeacherAssignments: async () => [{
      id: "assignment-1",
      name: "Sequencing",
      lessonId: "sequencing",
      classId: "class-1",
      studentId: null,
      dueAt: null,
      createdAt: "2026-08-01T00:00:00.000Z",
    }],
    listStudentAssignments: async () => [],
    listAttempts: async () => new Map(),
    listTeacherAssignmentScores: async () => new Map([
      ["assignment-1", [{
        studentId: "student-1",
        status: "completed",
        overallScore: 87,
        overallMaxScore: 87,
        overallScorePct: 100,
        gameScores: [{
          gameId: "sequencing:0",
          score: 5,
          maxScore: 5,
          scorePct: 100,
          completedAt: "2026-08-02T00:00:00.000Z",
        }],
      }]],
    ]),
  } as unknown as AssignmentsListDeps);

  const response = await handler(new Request("http://local/assignments-list?classId=class-1"));
  const json = await response.json();

  assertEquals(json.assignments[0].studentScores, [{
    studentId: "student-1",
    status: "completed",
    overallScore: 87,
    overallMaxScore: 87,
    overallScorePct: 100,
    gameScores: [{
      gameId: "sequencing:0",
      score: 5,
      maxScore: 5,
      scorePct: 100,
      completedAt: "2026-08-02T00:00:00.000Z",
    }],
  }]);
});
