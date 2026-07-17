import { assertEquals } from "jsr:@std/assert";
import { createStudentRegisterHandler } from "./handler.ts";

Deno.test("student-register returns already_registered when the LRN already exists", async () => {
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => ({ id: "class-1", name: "Section A" }),
    findStudentByNormalizedLrn: async () => ({ id: "student-1" }),
    createHiddenStudent: async () => {
      throw new Error("should not create user");
    },
    updateStudentProfile: async () => {},
    enrollStudent: async () => {},
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ lrn: "1234-5678-9012", classCode: "abc123", lastName: "Dela Cruz" }),
  }));

  assertEquals(response.status, 409);
  assertEquals(await response.json(), { status: "already_registered" });
});

Deno.test("student-register returns 404 when the class code is unknown", async () => {
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => null,
    findStudentByNormalizedLrn: async () => null,
    createHiddenStudent: async () => {
      throw new Error("should not create user");
    },
    updateStudentProfile: async () => {},
    enrollStudent: async () => {},
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", classCode: "missing", lastName: "Santos" }),
  }));

  assertEquals(response.status, 404);
});

Deno.test("student-register creates a student, enrolls the class, and returns a token hash", async () => {
  const calls: string[] = [];
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => ({ id: "class-1", name: "Section A" }),
    findStudentByNormalizedLrn: async () => null,
    createHiddenStudent: async () => {
      calls.push("createHiddenStudent");
      return { id: "student-1", email: "student.123456789012@auth.mathventure.invalid" };
    },
    updateStudentProfile: async () => {
      calls.push("updateStudentProfile");
    },
    enrollStudent: async () => {
      calls.push("enrollStudent");
    },
    issueStudentSession: async () => {
      calls.push("issueStudentSession");
      return {
        status: "ok" as const,
        email: "student.123456789012@auth.mathventure.invalid",
        tokenHash: "token-hash",
        verifyType: "email" as const,
      };
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ lrn: "1234-5678-9012", classCode: "abc123", lastName: "Santos" }),
  }));

  assertEquals(response.status, 201);
  assertEquals(await response.json(), {
    status: "ok",
    email: "student.123456789012@auth.mathventure.invalid",
    tokenHash: "token-hash",
    verifyType: "email",
  });
  assertEquals(calls, [
    "createHiddenStudent",
    "updateStudentProfile",
    "enrollStudent",
    "issueStudentSession",
  ]);
});

Deno.test("student-register returns a JSON 500 with CORS headers when a dependency throws", async () => {
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => {
      throw new Error("boom");
    },
    findStudentByNormalizedLrn: async () => null,
    createHiddenStudent: async () => {
      throw new Error("should not create user");
    },
    updateStudentProfile: async () => {},
    enrollStudent: async () => {},
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", classCode: "abc123", lastName: "Santos" }),
  }));

  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(await response.json(), { error: "We couldn't register that student right now." });
});
