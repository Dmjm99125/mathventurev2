import { assertEquals, assertStringIncludes } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherWorkspaceBoard.tsx", import.meta.url));
const sidebarSource = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherSidebar.tsx", import.meta.url));

Deno.test("teacher desktop rail stays content-sized and mobile-hidden", () => {
  assertStringIncludes(sidebarSource, "hidden min-w-0");
  assertStringIncludes(sidebarSource, "md:flex");
  assertStringIncludes(sidebarSource, "lg:fixed");
  assertStringIncludes(sidebarSource, "lg:top-16");
  assertStringIncludes(sidebarSource, "lg:bottom-0");
  assertStringIncludes(sidebarSource, "lg:h-[calc(100dvh-4rem)]");
  assertStringIncludes(sidebarSource, "lg:overflow-y-auto");
  assertStringIncludes(sidebarSource, "lg:flex-none");
  assertEquals(sidebarSource.includes("lg:sticky"), false);
});

Deno.test("teacher workspace composes a separate sidebar component", () => {
  assertStringIncludes(source, "TeacherSidebar");
  assertStringIncludes(source, "lg:pl-[280px]");
  assertEquals(source.includes("<aside"), false);
  assertStringIncludes(sidebarSource, "<aside");
  assertStringIncludes(sidebarSource, "TEACHER_NAV_ITEMS");
});
