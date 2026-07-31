import { assert, assertEquals, assertFalse } from "jsr:@std/assert";
import {
  buildStudentEmail,
  normalizeClassCode,
  normalizeFirstName,
  normalizeLastName,
  normalizeTeacherFirstName,
  studentDisplayName,
} from "../../../../supabase/functions/_shared/student_auth.ts";

Deno.test("normalizeClassCode and person names uppercase trimmed values", () => {
  assertEquals(normalizeClassCode(" ab12cd "), "AB12CD");
  assertEquals(normalizeTeacherFirstName(" ana   maria "), "ANA MARIA");
  assertEquals(normalizeFirstName(" juan   miguel "), "JUAN MIGUEL");
  assertEquals(normalizeLastName(" dela   Cruz "), "DELA CRUZ");
});

Deno.test("buildStudentEmail and studentDisplayName stay deterministic", () => {
  assertEquals(buildStudentEmail("test-key"), "student.test-key@auth.mathventure.invalid");
  assertEquals(studentDisplayName(" dela Cruz ", " juan "), "dela Cruz, juan");
});

Deno.test("normalizeFirstName rejects empty values after trimming", () => {
  assertFalse(Boolean(normalizeFirstName("   ")));
  assert(Boolean(normalizeFirstName("ana")));
});
