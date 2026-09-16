import { assert, assertStringIncludes } from "jsr:@std/assert";

const page = await Deno.readTextFile(new URL("../../../src/pages/teacher.tsx", import.meta.url));
const summary = await Deno.readTextFile(new URL("../../../src/components/teacher/reports/TeacherReportsClassroomSummary.tsx", import.meta.url));
const styles = await Deno.readTextFile(new URL("../../../src/index.css", import.meta.url));
const layout = await Deno.readTextFile(new URL("../../../src/components/layout.tsx", import.meta.url));

Deno.test("settings exposes real account and session controls", () => {
  for (const required of ["TeacherSettingsPage", "useAuth", "signOut", "Your teacher account"]) {
    assertStringIncludes(page, required);
  }
});

Deno.test("reports use the teacher flat numeric hierarchy", () => {
  for (const required of ["teacher-section", "tabular-nums", "Classroom Summary"]) {
    assertStringIncludes(summary, required);
  }
});

Deno.test("teacher theme is scoped and includes the learning trail texture", () => {
  for (const required of ["--teacher-sand", "--teacher-moss", "teacher-grain::before", "teacher-learning-trail", "prefers-reduced-motion"]) {
    assertStringIncludes(styles, required);
  }
});

Deno.test("teacher scrolling avoids full-page repaint effects", () => {
  assert(!styles.includes("feTurbulence"));
  assert(!styles.includes("background-attachment: fixed"));
  assertStringIncludes(styles, "repeating-radial-gradient");
  assertStringIncludes(layout, "teacher-topbar");
});
