import { assertEquals } from "jsr:@std/assert";
import { createStudentLoginHandler } from "./handler.ts";

Deno.test("student-login returns invalid_credentials when the student name is unknown", async () => {
  const handler = createStudentLoginHandler({
    findStudentEmailByNormalizedName: async () => null,
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lastName: "Santos", firstName: "Maria" }),
  }));

  assertEquals(response.status, 401);
  assertEquals(await response.json(), { status: "invalid_credentials" });
});

Deno.test("student-login returns invalid_credentials when the student name is ambiguous", async () => {
  const handler = createStudentLoginHandler({
    findStudentEmailByNormalizedName: async () => "ambiguous",
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lastName: "Santos", firstName: "Maria" }),
  }));

  assertEquals(response.status, 401);
});

Deno.test("student-login returns a token hash when the student name matches", async () => {
  const handler = createStudentLoginHandler({
    findStudentEmailByNormalizedName: async () => "student.test-key@auth.mathventure.invalid",
    issueStudentSession: async () => ({
      status: "ok" as const,
      email: "student.test-key@auth.mathventure.invalid",
      tokenHash: "token-hash",
      verifyType: "email" as const,
    }),
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lastName: "Santos", firstName: "Maria" }),
  }));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    status: "ok",
    email: "student.test-key@auth.mathventure.invalid",
    tokenHash: "token-hash",
    verifyType: "email",
  });
});

Deno.test("student-login returns a JSON 500 with CORS headers when a dependency throws", async () => {
  const handler = createStudentLoginHandler({
    findStudentEmailByNormalizedName: async () => {
      throw new Error("boom");
    },
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lastName: "Santos", firstName: "Maria" }),
  }));

  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(await response.json(), { error: "We couldn't sign that student in right now." });
});
