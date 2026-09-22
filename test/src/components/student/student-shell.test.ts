import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../../src/components/student/StudentShell.tsx", import.meta.url));

Deno.test("student shell exposes lessons and classroom destinations", () => {
  assertEquals(source.includes("STUDENT_NAV_ITEMS"), true);
  assertEquals(source.includes('current === "classroom"'), true);
  assertEquals(source.includes('aria-label="Student navigation"'), true);
});

Deno.test("student shell keeps its styling scoped to the student shell", () => {
  assertEquals(source.includes('className="student-shell'), true);
  assertEquals(source.includes('className="student-shell__nav'), true);
  assertEquals(source.includes('aria-current={active ? "page" : undefined}'), true);
});
