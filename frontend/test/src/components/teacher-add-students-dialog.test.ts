import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL(
    "../../../src/components/teacher/add-students/TeacherAddStudentsDialog.tsx",
    import.meta.url,
  ),
);

Deno.test("desktop add-students dialog constrains long manual lists to a scrollable viewport", () => {
  assertEquals(source.includes('className="flex h-full min-h-0 flex-col p-6"'), true);
  assertEquals(
    source.includes(
      '<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">',
    ),
    true,
  );
});
