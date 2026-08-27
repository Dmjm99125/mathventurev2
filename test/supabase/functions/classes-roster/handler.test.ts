import { assertEquals } from "jsr:@std/assert";
import { createClassesRosterHandler } from "../../../../supabase/functions/classes-roster/handler.ts";

Deno.test("classes-roster derives names and detailed progress from child game rows", async () => {
  const handler = createClassesRosterHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher One" }),
    getTeacherClassroom: async () => ({ id: "classroom-1", teacherId: "teacher-1", name: "Classroom" }),
    listRosterStudents: async () => [{
      id: "student-1",
      fullName: "Santos, Maria",
      firstName: "Maria",
      lastName: "Santos",
      joinedAt: "2026-07-20T00:00:00.000Z",
    }],
    listDetailedGameResults: async () => [
      {
        studentId: "student-1",
        gameId: "colors:0",
        score: 1,
        maxScore: 1,
        completedAt: "2026-07-27T09:00:00.000Z",
      },
      {
        studentId: "student-1",
        gameId: "colors:1",
        score: 3,
        maxScore: 4,
        completedAt: "2026-07-28T09:00:00.000Z",
      },
    ],
  });

  const response = await handler(new Request("http://local/classes-roster"));
  const json = await response.json();

  assertEquals(json.students[0], {
    id: "student-1",
    fullName: "Santos, Maria",
    firstName: "Maria",
    lastName: "Santos",
    joinedAt: "2026-07-20T00:00:00.000Z",
    appCompletionPct: 3,
    lastPlayedPct: 75,
  });
});

Deno.test("classes-roster leaves detailed progress empty when no child rows exist", async () => {
  const handler = createClassesRosterHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher One" }),
    getTeacherClassroom: async () => ({ id: "classroom-1", teacherId: "teacher-1", name: "Classroom" }),
    listRosterStudents: async () => [{
      id: "student-1",
      fullName: "Student",
      firstName: "Student",
      lastName: null,
      joinedAt: "2026-07-20T00:00:00.000Z",
    }],
    listDetailedGameResults: async () => [],
  });

  const response = await handler(new Request("http://local/classes-roster"));
  const json = await response.json();

  assertEquals(json.students[0].appCompletionPct, null);
  assertEquals(json.students[0].lastPlayedPct, null);
});
