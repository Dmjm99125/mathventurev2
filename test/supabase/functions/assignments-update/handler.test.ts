import { assertEquals } from "jsr:@std/assert";
import {
  createAssignmentsUpdateHandler,
  type AssignmentsUpdateDeps,
} from "../../../../supabase/functions/assignments-update/handler.ts";

function request(body: Record<string, unknown>) {
  return new Request("http://local/assignments-update", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("assignments-update lets the owning teacher rename a quiz and change its due date", async () => {
  const updates: Record<string, unknown>[] = [];
  const deps: AssignmentsUpdateDeps = {
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher" }),
    updateAssignment: async (input) => {
      updates.push(input);
      return { id: input.assignmentId, name: input.name, due_at: input.dueAt };
    },
  };

  const response = await createAssignmentsUpdateHandler(deps)(request({
    assignmentId: "assignment-1",
    lessonId: "addition",
    name: "Addition Review",
    dueAt: "2026-09-30T23:59:59.999Z",
  }));

  assertEquals(response.status, 200);
  assertEquals(updates[0], {
    assignmentId: "assignment-1",
    lessonId: "addition",
    name: "Addition Review",
    dueAt: "2026-09-30T23:59:59.999Z",
    assignedBy: "teacher-1",
  });
});

Deno.test("assignments-update falls back to the topic when the quiz name is cleared", async () => {
  let updatedName = "";
  const deps: AssignmentsUpdateDeps = {
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher" }),
    updateAssignment: async (input) => {
      updatedName = input.name;
      return { id: input.assignmentId };
    },
  };

  const response = await createAssignmentsUpdateHandler(deps)(request({
    assignmentId: "assignment-1",
    lessonId: "addition",
    name: "   ",
    dueAt: null,
  }));

  assertEquals(response.status, 200);
  assertEquals(updatedName, "addition");
});

Deno.test("assignments-update rejects a non-teacher", async () => {
  const deps: AssignmentsUpdateDeps = {
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student" }),
    updateAssignment: async () => ({ id: "assignment-1" }),
  };

  assertEquals((await createAssignmentsUpdateHandler(deps)(request({
    assignmentId: "assignment-1",
    lessonId: "addition",
    name: "Updated",
    dueAt: null,
  }))).status, 403);
});
