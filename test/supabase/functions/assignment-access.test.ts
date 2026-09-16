import { assertEquals } from "jsr:@std/assert";
import { canTeacherManageAssignment } from "../../../supabase/functions/_shared/assignment-access.ts";

Deno.test("assignment access allows the assigning teacher", () => {
  assertEquals(
    canTeacherManageAssignment(
      { assignedBy: "teacher-1", classId: "class-1" },
      "teacher-1",
      [],
    ),
    true,
  );
});

Deno.test("assignment access allows the owner of a target class", () => {
  assertEquals(
    canTeacherManageAssignment(
      { assignedBy: "teacher-2", classId: "class-1" },
      "teacher-1",
      ["class-1"],
    ),
    true,
  );
});

Deno.test("assignment access keeps direct student assignments creator-only", () => {
  assertEquals(
    canTeacherManageAssignment(
      { assignedBy: "teacher-2", classId: null },
      "teacher-1",
      ["class-1"],
    ),
    false,
  );
});
