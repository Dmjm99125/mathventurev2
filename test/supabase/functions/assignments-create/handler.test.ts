import { assertEquals } from "jsr:@std/assert";
import {
  createAssignmentsCreateHandler,
  type AssignmentsCreateDeps,
} from "../../../../supabase/functions/assignments-create/handler.ts";

Deno.test("assignments-create stores a supplied name and allows the same lesson to be assigned again", async () => {
  const inserted: Record<string, unknown>[] = [];
  const deps: AssignmentsCreateDeps = {
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher" }),
    isTeacherForClass: async () => true,
    insertAssignment: async (input) => {
      inserted.push(input);
      return { id: "assignment-" + inserted.length, ...input };
    },
  };
  const handler = createAssignmentsCreateHandler(deps);
  const request = (name: string) => new Request("http://local/assignments-create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lessonId: "sequencing", classId: "class-1", name }),
  });

  assertEquals((await handler(request("Sequencing Review"))).status, 201);
  assertEquals((await handler(request("Sequencing Retake"))).status, 201);
  assertEquals(inserted.map((row) => row.name), ["Sequencing Review", "Sequencing Retake"]);
});
