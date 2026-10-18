import { assertEquals } from "jsr:@std/assert";
import { createClassesAddStudentsHandler } from "../../../../supabase/functions/classes-add-students/handler.ts";

Deno.test("classes-add-students rejects non-teacher callers", async () => {
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({
      id: "student-1",
      role: "student",
      full_name: "Student One",
    }),
    getTeacherClass: async () => ({
      id: "classroom-1",
      teacherId: "teacher-1",
      name: "Classroom",
      createdAt: "2026-07-01T00:00:00.000Z",
      archivedAt: null,
    }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      throw new Error("should not create users");
    },
    deleteHiddenStudent: async () => {},
  });

  const response = await handler(
    new Request("http://local/classes-add-students", {
      method: "POST",
      body: JSON.stringify({
        students: [{ lastName: "Santos", firstName: "Maria" }],
      }),
    }),
  );

  assertEquals(response.status, 403);
  assertEquals(await response.json(), {
    error: "Only teachers can add students",
  });
});

Deno.test("classes-add-students creates every student and returns a summary", async () => {
  const provisioned: string[] = [];
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1",
      role: "teacher",
      full_name: "Teacher One",
    }),
    getTeacherClass: async () => ({
      id: "classroom-1",
      teacherId: "teacher-1",
      name: "Classroom",
      createdAt: "2026-07-01T00:00:00.000Z",
      archivedAt: null,
    }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async ({ identity }) => {
      provisioned.push(
        `${identity.normalizedLastName}:${identity.normalizedFirstName}`,
      );
      return {
        studentId: crypto.randomUUID(),
        email: "student@auth.mathventure.invalid",
      };
    },
    deleteHiddenStudent: async () => {},
  });

  const response = await handler(
    new Request("http://local/classes-add-students", {
      method: "POST",
      body: JSON.stringify({
        classId: "classroom-1",
        students: [
          { lastName: "Santos", firstName: "Maria" },
          { lastName: "Cruz", firstName: "Paolo" },
        ],
      }),
    }),
  );

  assertEquals(response.status, 201);
  assertEquals(await response.json(), {
    createdCount: 2,
  });
  assertEquals(provisioned, ["SANTOS:MARIA", "CRUZ:PAOLO"]);
});

Deno.test("classes-add-students rolls back already-created students when a later row fails", async () => {
  const deleted: string[] = [];
  let callCount = 0;
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1",
      role: "teacher",
      full_name: "Teacher One",
    }),
    getTeacherClass: async () => ({
      id: "classroom-1",
      teacherId: "teacher-1",
      name: "Classroom",
      createdAt: "2026-07-01T00:00:00.000Z",
      archivedAt: null,
    }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      callCount += 1;
      if (callCount === 1) {
        return {
          studentId: "student-1",
          email: "student-1@auth.mathventure.invalid",
        };
      }
      throw new Error("boom");
    },
    deleteHiddenStudent: async (studentId) => {
      deleted.push(studentId);
    },
  });

  const response = await handler(
    new Request("http://local/classes-add-students", {
      method: "POST",
      body: JSON.stringify({
        classId: "classroom-1",
        students: [
          { lastName: "Santos", firstName: "Maria" },
          { lastName: "Cruz", firstName: "Paolo" },
        ],
      }),
    }),
  );

  assertEquals(response.status, 500);
  assertEquals(deleted, ["student-1"]);
});

Deno.test("classes-add-students rejects duplicate normalized names inside the same batch", async () => {
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1",
      role: "teacher",
      full_name: "Teacher One",
    }),
    getTeacherClass: async () => ({
      id: "classroom-1",
      teacherId: "teacher-1",
      name: "Classroom",
      createdAt: "2026-07-01T00:00:00.000Z",
      archivedAt: null,
    }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      throw new Error("should not create users");
    },
    deleteHiddenStudent: async () => {},
  });

  const response = await handler(
    new Request("http://local/classes-add-students", {
      method: "POST",
      body: JSON.stringify({
        classId: "classroom-1",
        students: [
          { lastName: " Santos ", firstName: "Maria" },
          { lastName: "Santos", firstName: " Maria " },
        ],
      }),
    }),
  );

  assertEquals(response.status, 409);
  assertEquals(await response.json(), {
    error: "Each student name can appear only once per batch.",
  });
});

Deno.test("classes-add-students creates students in the selected class", async () => {
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClass: async () => ({ id: "classroom-1", teacherId: "teacher-1", name: "Classroom", createdAt: "2026-07-01T00:00:00.000Z", archivedAt: null }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => ({
      studentId: "student-1",
      email: "student.1@auth.mathventure.invalid",
    }),
    deleteHiddenStudent: async () => {},
  });

  const response = await handler(new Request("http://local/classes-add-students", {
    method: "POST",
    body: JSON.stringify({
      classId: "classroom-1",
      students: [{ lastName: "Santos", firstName: "Maria" }],
    }),
  }));

  assertEquals(response.status, 201);
  assertEquals(await response.json(), {
    createdCount: 1,
  });
});

Deno.test("classes-add-students rejects archived classes before provisioning", async () => {
  let provisioned = false;
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClass: async () => ({
      id: "classroom-1",
      teacherId: "teacher-1",
      name: "Classroom",
      createdAt: "2026-07-01T00:00:00.000Z",
      archivedAt: "2026-09-01T00:00:00.000Z",
    }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      provisioned = true;
      return { studentId: "student-1", email: "student@invalid" };
    },
    deleteHiddenStudent: async () => {},
  });

  const response = await handler(new Request("http://local/classes-add-students", {
    method: "POST",
    body: JSON.stringify({ classId: "classroom-1", students: [{ lastName: "Santos", firstName: "Maria" }] }),
  }));

  assertEquals(response.status, 409);
  assertEquals(provisioned, false);
});
