import { assertEquals } from "jsr:@std/assert";

const appSource = await Deno.readTextFile(new URL("../../../src/App.tsx", import.meta.url));
const pageSource = await Deno.readTextFile(new URL("../../../src/pages/student.tsx", import.meta.url));
const loadingSource = await Deno.readTextFile(new URL("../../../src/components/student/StudentPortalLoading.tsx", import.meta.url));
const languageSource = await Deno.readTextFile(new URL("../../../src/lib/i18n/useLanguage.tsx", import.meta.url));
const styleSource = await Deno.readTextFile(new URL("../../../src/index.css", import.meta.url));

Deno.test("student classroom route delegates navigation to the student shell", () => {
  assertEquals(appSource.includes('<AppLayout sidebarMode="hidden"><StudentClassroomPage /></AppLayout>'), true);
});

Deno.test("student pages use separate lessons and classroom shell states", () => {
  assertEquals(pageSource.includes('<StudentShell current="lessons">'), true);
  assertEquals(pageSource.includes('<StudentShell current="classroom">'), true);
});

Deno.test("student navigation uses plain destination labels", () => {
  assertEquals(languageSource.includes("'student.dashboard': 'Lessons'"), true);
  assertEquals(languageSource.includes("'student.classroom': 'Classroom'"), true);
  assertEquals(languageSource.includes("'student.dashboard': 'Mga Aralin'"), true);
  assertEquals(languageSource.includes("'student.classroom': 'Klase'"), true);
});

Deno.test("student loading state uses the student shell visual contract", () => {
  assertEquals(loadingSource.includes("student-loading-screen"), true);
  assertEquals(loadingSource.includes("student-loading-card"), true);
  assertEquals(loadingSource.includes("student-loading__progress"), true);
  assertEquals(pageSource.includes('<StudentShell current="lessons">\n        <StudentPortalLoading />'), false);
  assertEquals(pageSource.includes('<StudentShell current="classroom">\n        <StudentPortalLoading />'), false);
});

Deno.test("student loading state stays readable on small screens and reduced motion", () => {
  assertEquals(styleSource.includes(".student-loading-screen"), true);
  assertEquals(styleSource.includes("@media (max-width: 420px)"), true);
  assertEquals(styleSource.includes(".student-loading-screen .student-loading__fill"), true);
});
