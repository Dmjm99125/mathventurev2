import { assertEquals } from "jsr:@std/assert";
import { createStudentViewAsHandler } from "../../../../supabase/functions/student-view-as/handler.ts";

const teacher = { id: "teacher-1", role: "teacher" as const, full_name: "Ana Cruz" };

Deno.test("student-view-as rejects unauthenticated requests", async () => {
  const handler = createStudentViewAsHandler({
    getAuthedProfile: async () => null,
    isStudentInTeacherClass: async () => true,
    getStudentEmail: async () => "student@auth.mathventure.invalid",
    issueStudentSession: async () => {
      throw new Error("should not issue a session");
    },
  });

  const response = await handler(new Request("http://local/student-view-as", {
    method: "POST",
    body: JSON.stringify({ studentId: "student-1" }),
  }));

  assertEquals(response.status, 401);
});

Deno.test("student-view-as rejects non-teacher callers", async () => {
  const handler = createStudentViewAsHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Maria Santos" }),
    isStudentInTeacherClass: async () => true,
    getStudentEmail: async () => "student@auth.mathventure.invalid",
    issueStudentSession: async () => {
      throw new Error("should not issue a session");
    },
  });

  const response = await handler(new Request("http://local/student-view-as", {
    method: "POST",
    body: JSON.stringify({ studentId: "student-1" }),
  }));

  assertEquals(response.status, 403);
});

Deno.test("student-view-as rejects a student outside the teacher classroom", async () => {
  const handler = createStudentViewAsHandler({
    getAuthedProfile: async () => teacher,
    isStudentInTeacherClass: async () => false,
    getStudentEmail: async () => "student@auth.mathventure.invalid",
    issueStudentSession: async () => {
      throw new Error("should not issue a session");
    },
  });

  const response = await handler(new Request("http://local/student-view-as", {
    method: "POST",
    body: JSON.stringify({ studentId: "student-2" }),
  }));

  assertEquals(response.status, 403);
});

Deno.test("student-view-as issues a session only for the requested roster student", async () => {
  const calls: string[] = [];
  const handler = createStudentViewAsHandler({
    getAuthedProfile: async () => teacher,
    isStudentInTeacherClass: async ({ teacherId, studentId }) => {
      calls.push(`membership:${teacherId}:${studentId}`);
      return true;
    },
    getStudentEmail: async (studentId) => {
      calls.push(`email:${studentId}`);
      return "student-1@auth.mathventure.invalid";
    },
    issueStudentSession: async (email) => {
      calls.push(`session:${email}`);
      return {
        status: "ok" as const,
        email,
        tokenHash: "token-hash",
        verifyType: "email" as const,
      };
    },
  });

  const response = await handler(new Request("http://local/student-view-as", {
    method: "POST",
    body: JSON.stringify({ studentId: "student-1" }),
  }));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    status: "ok",
    email: "student-1@auth.mathventure.invalid",
    tokenHash: "token-hash",
    verifyType: "email",
  });
  assertEquals(calls, [
    "membership:teacher-1:student-1",
    "email:student-1",
    "session:student-1@auth.mathventure.invalid",
  ]);
});

Deno.test("student-view-as rejects a missing student id", async () => {
  const handler = createStudentViewAsHandler({
    getAuthedProfile: async () => teacher,
    isStudentInTeacherClass: async () => true,
    getStudentEmail: async () => "student@auth.mathventure.invalid",
    issueStudentSession: async () => {
      throw new Error("should not issue a session");
    },
  });

  const response = await handler(new Request("http://local/student-view-as", {
    method: "POST",
    body: JSON.stringify({}),
  }));

  assertEquals(response.status, 422);
});
