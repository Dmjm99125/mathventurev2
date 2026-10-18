import { assertEquals } from "jsr:@std/assert";
import { createClassesListHandler } from "./handler.ts";

Deno.test("classes-list returns all teacher classes split by archive state", async () => {
  const handler = createClassesListHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    listTeacherClasses: async () => [
      {
        id: "class-1",
        teacherId: "teacher-1",
        name: "Grade 1",
        createdAt: "2026-07-31T00:00:00.000Z",
        archivedAt: null,
        studentCount: 4,
      },
      {
        id: "class-2",
        teacherId: "teacher-1",
        name: "Grade 2",
        createdAt: "2026-08-01T00:00:00.000Z",
        archivedAt: "2026-09-01T00:00:00.000Z",
        studentCount: 2,
      },
    ],
    getStudentClassroom: async () => null,
  });

  const response = await handler(new Request("http://local/classes-list"));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    classes: [{
      id: "class-1",
      name: "Grade 1",
      createdAt: "2026-07-31T00:00:00.000Z",
      archivedAt: null,
      studentCount: 4,
    }],
    archivedClasses: [{
      id: "class-2",
      name: "Grade 2",
      createdAt: "2026-08-01T00:00:00.000Z",
      archivedAt: "2026-09-01T00:00:00.000Z",
      studentCount: 2,
    }],
  });
});

Deno.test("classes-list returns one student classroom summary", async () => {
  const handler = createClassesListHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Maria Santos" }),
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
