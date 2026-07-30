import { assertEquals } from "jsr:@std/assert";
import { createClassesAddStudentsHandler } from "../../../../supabase/functions/classes-add-students/handler.ts";

Deno.test("classes-add-students rejects non-teacher callers", async () => {
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({
      id: "student-1",
      role: "student",
      full_name: "Student One",
    }),
    findOwnedClass: async () => ({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Class A",
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
        classId: "class-1",
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
    findOwnedClass: async () => ({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Class A",
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
        classId: "class-1",
        students: [
          { lastName: "Santos", firstName: "Maria" },
          { lastName: "Cruz", firstName: "Paolo" },
        ],
      }),
    }),
  );

  assertEquals(response.status, 201);
  assertEquals(await response.json(), {
    classId: "class-1",
    className: "Class A",
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
    findOwnedClass: async () => ({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Class A",
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
        classId: "class-1",
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
    findOwnedClass: async () => ({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Class A",
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
        classId: "class-1",
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
