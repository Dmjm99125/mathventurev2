import { assert } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL(
    "../../../src/components/teacher/add-students/TeacherAddStudentsManualEditor.tsx",
    import.meta.url,
  ),
);

Deno.test("manual add-students editor keeps long batches scrollable with persistent actions", () => {
  assert(source.includes("formatTeacherAddStudentsCount(rows.length)"));
  assert(source.includes('aria-live="polite"'));
  assert(source.includes("Add another student"));
  assert(source.includes("min-h-0 flex-1 space-y-4 overflow-y-auto"));
  assert(source.includes("border-t border-border/70"));
});
