import { assertEquals } from "jsr:@std/assert";
import { createClassesCreateHandler } from "./handler.ts";

Deno.test("classes-create creates a named active class", async () => {
  let receivedName = "";
  const handler = createClassesCreateHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    createTeacherClass: async (_teacherId, name) => {
      receivedName = name;
      return {
        id: "class-2",
        teacherId: "teacher-1",
        name,
        createdAt: "2026-08-01T00:00:00.000Z",
        archivedAt: null,
        studentCount: 0,
      };
    },
  });

  const response = await handler(new Request("http://local/classes-create", {
    method: "POST",
    body: JSON.stringify({ name: "  Grade 2  " }),
  }));

  assertEquals(response.status, 201);
  assertEquals(receivedName, "Grade 2");
  assertEquals((await response.json()).classroom.name, "Grade 2");
});
