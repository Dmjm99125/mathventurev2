import { assertEquals } from "jsr:@std/assert";
import { createStudentRegisterHandler } from "../../../../supabase/functions/student-register/handler.ts";

Deno.test("student-register returns already_registered when the student name already exists", async () => {
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => ({ id: "class-1", name: "Section A" }),
    hasStudentWithNormalizedName: async () => true,
    provisionStudentForClass: async () => {
      throw new Error("should not provision a student");
    },
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ classCode: "abc123", lastName: "Dela Cruz", firstName: "Juan" }),
  }));

  assertEquals(response.status, 409);
  assertEquals(await response.json(), { status: "already_registered" });
});

Deno.test("student-register returns 404 when the class code is unknown", async () => {
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => null,
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      throw new Error("should not provision a student");
    },
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ classCode: "missing", lastName: "Santos", firstName: "Maria" }),
  }));

  assertEquals(response.status, 404);
});

Deno.test("student-register creates a student, enrolls the class, and returns a token hash", async () => {
  const calls: string[] = [];
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => ({ id: "class-1", name: "Section A" }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      calls.push("provisionStudentForClass");
      return {
        studentId: "student-1",
        email: "student.test-key@auth.mathventure.invalid",
      };
    },
    issueStudentSession: async () => {
      calls.push("issueStudentSession");
      return {
        status: "ok" as const,
        email: "student.test-key@auth.mathventure.invalid",
        tokenHash: "token-hash",
        verifyType: "email" as const,
      };
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ classCode: "abc123", lastName: "Santos", firstName: "Maria" }),
  }));

  assertEquals(response.status, 201);
  assertEquals(await response.json(), {
    status: "ok",
    email: "student.test-key@auth.mathventure.invalid",
    tokenHash: "token-hash",
    verifyType: "email",
  });
  assertEquals(calls, [
    "provisionStudentForClass",
    "issueStudentSession",
  ]);
});

Deno.test("student-register returns a JSON 500 with CORS headers when a dependency throws", async () => {
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => {
      throw new Error("boom");
    },
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      throw new Error("should not provision a student");
    },
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ classCode: "abc123", lastName: "Santos", firstName: "Maria" }),
  }));

  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(await response.json(), { error: "We couldn't register that student right now." });
});
