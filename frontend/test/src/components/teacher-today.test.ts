import { assertStringIncludes } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherToday.tsx", import.meta.url));
const attention = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherAttentionRail.tsx", import.meta.url));

Deno.test("Today owns attention-first classroom actions", () => {
  for (const required of [
    "useTeacherClassroom",
    "useClassRoster",
    "useAssignments",
    "useTeacherReportsOverview",
    "Add students",
    "Assign quiz",
    "Retry",
  ]) {
    assertStringIncludes(source, required);
  }
});

Deno.test("attention rail uses direct student actions", () => {
  for (const required of ["attentionStudents", "View student", "reasonCodes", "aria-label", "No students need attention"]) {
    assertStringIncludes(attention, required);
  }
});

Deno.test("Today heading renders class name larger than Today", () => {
  assertStringIncludes(source, "currentClassName");
  assertStringIncludes(source, "text-4xl font-bold tracking-tight text-[var(--teacher-ink)] sm:text-5xl");
  assertStringIncludes(source, "Today");
  assertStringIncludes(source, "text-2xl font-bold tracking-tight text-[var(--teacher-ink)]/80 sm:text-3xl");
});
