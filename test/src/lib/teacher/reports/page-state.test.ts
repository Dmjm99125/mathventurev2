import { assertEquals } from "jsr:@std/assert";
import { buildTeacherClassReportPageState } from "../../../../../src/lib/teacher/reports/page-state.ts";

Deno.test("buildTeacherClassReportPageState keeps server errors in the report shell", () => {
  assertEquals(
    buildTeacherClassReportPageState({
      data: null,
      error: new Error("Class not found"),
    }),
    {
      kind: "error",
      title: "Class report",
      subtitle: "Choose another class or try a different report window.",
      message: "Class not found",
    },
  );
});
