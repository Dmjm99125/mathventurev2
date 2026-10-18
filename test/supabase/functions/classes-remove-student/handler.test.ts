import { assertEquals } from "jsr:@std/assert";
import { createClassesRemoveStudentHandler } from "../../../../supabase/functions/classes-remove-student/handler.ts";

Deno.test("classes-remove-student deletes class membership only", async () => {
  let removed: unknown = null;
  const handler = createClassesRemoveStudentHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher One" }),
    getTeacherClass: async () => ({ id: "classroom-1", teacherId: "teacher-1", name: "Classroom", createdAt: "2026-07-01T00:00:00.000Z", archivedAt: null }),
    removeMembership: async (input: { classId: string; studentId: string }) => {
      removed = input;
    },
  });

  const response = await handler(new Request("http://local/classes-remove-student", {
    method: "POST",
    body: JSON.stringify({ classId: "classroom-1", studentId: "student-1" }),
  }));

  assertEquals(response.status, 200);
  assertEquals(removed, { classId: "classroom-1", studentId: "student-1" });
});

Deno.test("classes-remove-student rejects non-teacher callers", async () => {
  const handler = createClassesRemoveStudentHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student One" }),
    getTeacherClass: async () => {
      throw new Error("should not load class");
    },
    removeMembership: async () => {
      throw new Error("should not remove membership");
    },
  });

  const response = await handler(new Request("http://local/classes-remove-student", {
    method: "POST",
    body: JSON.stringify({ classId: "classroom-1", studentId: "student-1" }),
  }));

  assertEquals(response.status, 403);
});

Deno.test("classes-remove-student rejects archived classes before deleting membership", async () => {
  let removed = false;
  const handler = createClassesRemoveStudentHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher One" }),
    getTeacherClass: async () => ({
      id: "classroom-1",
      teacherId: "teacher-1",
      name: "Classroom",
      createdAt: "2026-07-01T00:00:00.000Z",
      archivedAt: "2026-09-01T00:00:00.000Z",
    }),
    removeMembership: async () => {
      removed = true;
    },
  });

  const response = await handler(new Request("http://local/classes-remove-student", {
    method: "POST",
    body: JSON.stringify({ classId: "classroom-1", studentId: "student-1" }),
  }));

  assertEquals(response.status, 409);
  assertEquals(removed, false);
});
