import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL("../../../src/pages/teacher.tsx", import.meta.url),
);

Deno.test("teacher settings exposes all password fields", () => {
  assertEquals(source.includes("current-password"), true);
  assertEquals(source.includes("new-password"), true);
  assertEquals(source.includes("confirm-password"), true);
  assertEquals(source.includes("changeTeacherPassword"), true);
});

Deno.test("settings does not persist or log password values", () => {
  assertEquals(source.includes("localStorage.setItem"), false);
  assertEquals(source.includes("console.log(currentPassword"), false);
  assertEquals(source.includes("console.log(newPassword"), false);
});
