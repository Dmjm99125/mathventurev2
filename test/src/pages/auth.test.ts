import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/pages/auth.tsx", import.meta.url));

Deno.test("login exposes only teacher credentials", () => {
  assertEquals(source.includes("studentSignIn"), false);
  assertEquals(source.includes("setRole"), false);
  assertEquals(source.includes("teacherFirstName"), false);
  assertEquals(source.includes("lastName"), false);
  assertEquals(source.includes("firstName"), false);
});
