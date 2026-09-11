import { assertEquals } from "jsr:@std/assert";
import {
  createAssignmentsDeleteHandler,
  type AssignmentsDeleteDeps,
} from "../../../../supabase/functions/assignments-delete/handler.ts";

function request(body: Record<string, unknown>) {
  return new Request("http://local/assignments-delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("assignments-delete removes a quiz owned by the teacher", async () => {
  let deletedId = "";
  let deletedBy = "";
  const deps: AssignmentsDeleteDeps = {
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher" }),
    deleteAssignment: async (assignmentId, teacherId) => {
      deletedId = assignmentId;
      deletedBy = teacherId;
      return true;
    },
  };

  const response = await createAssignmentsDeleteHandler(deps)(request({ assignmentId: "assignment-1" }));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { deleted: true });
  assertEquals(deletedId, "assignment-1");
  assertEquals(deletedBy, "teacher-1");
});

Deno.test("assignments-delete returns not found when the teacher does not own the quiz", async () => {
  const deps: AssignmentsDeleteDeps = {
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher" }),
    deleteAssignment: async () => false,
  };

  const response = await createAssignmentsDeleteHandler(deps)(request({ assignmentId: "assignment-1" }));

  assertEquals(response.status, 404);
});
