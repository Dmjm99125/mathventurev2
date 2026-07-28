import { assertEquals } from "jsr:@std/assert";
import { createClassesRemoveStudentHandler } from "./handler.ts";

Deno.test("classes-remove-student deletes class membership only", async () => {
  let removed: unknown = null;
  const handler = createClassesRemoveStudentHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher One" }),
    findOwnedClass: async () => ({ id: "class-1", teacherId: "teacher-1" }),
    removeMembership: async (input: { classId: string; studentId: string }) => {
      removed = input;
    },
  });

  const response = await handler(new Request("http://local/classes-remove-student", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", studentId: "student-1" }),
  }));

  assertEquals(response.status, 200);
  assertEquals(removed, { classId: "class-1", studentId: "student-1" });
});

Deno.test("classes-remove-student rejects non-teacher callers", async () => {
  const handler = createClassesRemoveStudentHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student One" }),
    findOwnedClass: async () => {
      throw new Error("should not load class");
    },
    removeMembership: async () => {
      throw new Error("should not remove membership");
    },
  });

  const response = await handler(new Request("http://local/classes-remove-student", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", studentId: "student-1" }),
  }));

  assertEquals(response.status, 403);
});
