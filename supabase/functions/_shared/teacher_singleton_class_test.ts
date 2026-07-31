import { assertEquals, assertRejects } from "jsr:@std/assert";
import {
  HIDDEN_CLASSROOM_NAME,
  ensureTeacherSingletonClass,
  getTeacherSingletonClass,
} from "./teacher_singleton_class.ts";

Deno.test("ensureTeacherSingletonClass creates one hidden classroom when a teacher has none", async () => {
  const calls: string[] = [];

  const classroom = await ensureTeacherSingletonClass(
    {
      listTeacherClasses: async () => [],
      insertTeacherClass: async (teacherId: string) => {
        calls.push(`insert:${teacherId}`);
        return {
          id: "classroom-1",
          teacherId,
          name: HIDDEN_CLASSROOM_NAME,
          createdAt: "2026-07-31T00:00:00.000Z",
        };
      },
    },
    "teacher-1",
  );

  assertEquals(classroom, {
    id: "classroom-1",
    teacherId: "teacher-1",
    name: HIDDEN_CLASSROOM_NAME,
    createdAt: "2026-07-31T00:00:00.000Z",
  });
  assertEquals(calls, ["insert:teacher-1"]);
});

Deno.test("ensureTeacherSingletonClass reuses the existing hidden classroom when one already exists", async () => {
  const classroom = await ensureTeacherSingletonClass(
    {
      listTeacherClasses: async () => [
        {
          id: "classroom-1",
          teacherId: "teacher-1",
          name: HIDDEN_CLASSROOM_NAME,
          createdAt: "2026-07-31T00:00:00.000Z",
        },
      ],
      insertTeacherClass: async () => {
        throw new Error("should not insert a second classroom");
      },
    },
    "teacher-1",
  );

  assertEquals(classroom.id, "classroom-1");
});

Deno.test("getTeacherSingletonClass rejects duplicate classrooms for one teacher", async () => {
  await assertRejects(
    () =>
      getTeacherSingletonClass(
        {
          listTeacherClasses: async () => [
            {
              id: "classroom-1",
              teacherId: "teacher-1",
              name: HIDDEN_CLASSROOM_NAME,
              createdAt: "2026-07-31T00:00:00.000Z",
            },
            {
              id: "classroom-2",
              teacherId: "teacher-1",
              name: HIDDEN_CLASSROOM_NAME,
              createdAt: "2026-07-31T00:00:01.000Z",
            },
          ],
        },
        "teacher-1",
      ),
    Error,
    "Expected exactly one classroom for teacher teacher-1.",
  );
});
