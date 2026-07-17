import { assertEquals } from "jsr:@std/assert";
import { createStudentLoginHandler } from "./handler.ts";

Deno.test("student-login returns invalid_credentials when the LRN is unknown", async () => {
  const handler = createStudentLoginHandler({
    findStudentByNormalizedLrn: async () => null,
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", lastName: "Santos" }),
  }));

  assertEquals(response.status, 401);
  assertEquals(await response.json(), { status: "invalid_credentials" });
});

Deno.test("student-login returns invalid_credentials when the last name does not match", async () => {
  const handler = createStudentLoginHandler({
    findStudentByNormalizedLrn: async () => ({ normalizedLastName: "DELA CRUZ" }),
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", lastName: "Santos" }),
  }));

  assertEquals(response.status, 401);
});

Deno.test("student-login returns a token hash when the last name matches", async () => {
  const handler = createStudentLoginHandler({
    findStudentByNormalizedLrn: async () => ({ normalizedLastName: "SANTOS" }),
    issueStudentSession: async () => ({
      status: "ok" as const,
      email: "student.123456789012@auth.mathventure.invalid",
      tokenHash: "token-hash",
      verifyType: "email" as const,
    }),
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", lastName: "Santos" }),
  }));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    status: "ok",
    email: "student.123456789012@auth.mathventure.invalid",
    tokenHash: "token-hash",
    verifyType: "email",
  });
});

Deno.test("student-login returns a JSON 500 with CORS headers when a dependency throws", async () => {
  const handler = createStudentLoginHandler({
    findStudentByNormalizedLrn: async () => {
      throw new Error("boom");
    },
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", lastName: "Santos" }),
  }));

  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(await response.json(), { error: "We couldn't sign that student in right now." });
});
