import { assertEquals } from "jsr:@std/assert";
import { createClassesJoinHandler } from "./handler.ts";

Deno.test("classes-join returns 410 because class codes are no longer supported", async () => {
  const handler = createClassesJoinHandler();

  const response = await handler(new Request("http://local/classes-join", {
    method: "POST",
    body: JSON.stringify({ joinCode: "ABC123" }),
  }));

  assertEquals(response.status, 410);
  assertEquals(await response.json(), {
    error: "Class codes are no longer supported.",
  });
});
