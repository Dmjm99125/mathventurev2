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
