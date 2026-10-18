import { assertEquals, assertRejects } from "jsr:@std/assert";
import {
  assertWritableTeacherClass,
  getTeacherOwnedClass,
} from "./teacher_class_access.ts";

Deno.test("getTeacherOwnedClass returns an owned class", async () => {
  const classroom = await getTeacherOwnedClass(
    {
      getClass: async (teacherId: string, classId: string) => teacherId === "teacher-1" && classId === "class-1"
        ? {
            id: "class-1",
            teacherId: "teacher-1",
            name: "Classroom",
            createdAt: "2026-07-31T00:00:00.000Z",
            archivedAt: null,
          }
        : null,
    },
    "teacher-1",
    "class-1",
  );

  assertEquals(classroom.id, "class-1");
  assertEquals(classroom.archivedAt, null);
});

Deno.test("getTeacherOwnedClass rejects a missing or foreign class", async () => {
  await assertRejects(
    () => getTeacherOwnedClass(
      { getClass: async () => null },
      "teacher-1",
      "class-2",
    ),
    Error,
    "Classroom not found.",
  );
});

Deno.test("assertWritableTeacherClass rejects archived classes", () => {
  let error: Error | null = null;
  try {
    assertWritableTeacherClass({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Archived",
      createdAt: "2026-07-31T00:00:00.000Z",
      archivedAt: "2026-09-01T00:00:00.000Z",
    });
  } catch (caught) {
    error = caught instanceof Error ? caught : new Error(String(caught));
  }

  assertEquals(error?.message, "This classroom is archived and read-only.");
});
