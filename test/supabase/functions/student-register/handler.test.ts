import { assertEquals } from "jsr:@std/assert";
import { createStudentRegisterHandler } from "../../../../supabase/functions/student-register/handler.ts";

Deno.test("student-register no longer creates student accounts", async () => {
  const handler = createStudentRegisterHandler();

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({
      teacherFirstName: "Ana",
      lastName: "Cruz",
      firstName: "Maria",
    }),
  }));

  assertEquals(response.status, 410);
  assertEquals(await response.json(), {
    error: "Student accounts must be created by a teacher.",
  });
});
