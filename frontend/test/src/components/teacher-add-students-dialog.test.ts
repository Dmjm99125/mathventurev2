import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL(
    "../../../src/components/teacher/add-students/TeacherAddStudentsDialog.tsx",
    import.meta.url,
  ),
);

Deno.test("desktop add-students dialog constrains long manual lists to a scrollable viewport", () => {
  assertEquals(source.includes('className="flex h-full min-h-0 flex-col p-6"'), true);
});
