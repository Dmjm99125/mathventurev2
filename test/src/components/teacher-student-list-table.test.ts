import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherStudentListTable.tsx", import.meta.url));

Deno.test("teacher roster exposes a view account action", () => {
  assertEquals(source.includes("onView"), true);
  assertEquals(source.includes("View Account"), true);
});
