import { assertEquals } from "jsr:@std/assert";
import { createClassesListHandler } from "./handler.ts";

Deno.test("classes-list returns one teacher classroom without join codes", async () => {
  const handler = createClassesListHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClassroom: async () => ({
      id: "classroom-1",
      teacherId: "teacher-1",
      name: "Classroom",
      createdAt: "2026-07-31T00:00:00.000Z",
      studentCount: 4,
    }),
    getStudentClassroom: async () => null,
  });

  const response = await handler(new Request("http://local/classes-list"));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    classroom: {
      id: "classroom-1",
      createdAt: "2026-07-31T00:00:00.000Z",
      studentCount: 4,
    },
  });
});

Deno.test("classes-list returns one student classroom summary", async () => {
  const handler = createClassesListHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Maria Santos" }),
    getTeacherClassroom: async () => null,
    getStudentClassroom: async () => ({
      id: "classroom-1",
      teacherName: "Ana Cruz",
      joinedAt: "2026-07-31T00:00:00.000Z",
    }),
  });

  const response = await handler(new Request("http://local/classes-list"));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    classroom: {
      id: "classroom-1",
      teacherName: "Ana Cruz",
      joinedAt: "2026-07-31T00:00:00.000Z",
    },
  });
});
