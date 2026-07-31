import { assertEquals } from "jsr:@std/assert";
import { createClassesCreateHandler } from "./handler.ts";

Deno.test("classes-create returns the teacher singleton classroom", async () => {
  const handler = createClassesCreateHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    ensureTeacherClassroom: async () => ({
      id: "classroom-1",
      createdAt: "2026-07-31T00:00:00.000Z",
      studentCount: 4,
    }),
  });

  const response = await handler(new Request("http://local/classes-create", {
    method: "POST",
  }));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    classroom: {
      id: "classroom-1",
      createdAt: "2026-07-31T00:00:00.000Z",
      studentCount: 4,
    },
  });
});
