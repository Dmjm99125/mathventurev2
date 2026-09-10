import { assertEquals } from "jsr:@std/assert";
import { createStudentLoginHandler } from "../../../../supabase/functions/student-login/handler.ts";

Deno.test("student-login no longer creates sessions from names", async () => {
  const handler = createStudentLoginHandler();

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({
      teacherFirstName: "Ana",
      lastName: "Santos",
      firstName: "Maria",
    }),
  }));

  assertEquals(response.status, 410);
  assertEquals(await response.json(), {
    error: "Student login is available only through a teacher account.",
  });
});
