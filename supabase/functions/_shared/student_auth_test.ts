import { assert, assertEquals, assertFalse } from "jsr:@std/assert";
import {
  buildStudentEmail,
  isValidNormalizedLrn,
  normalizeClassCode,
  normalizeLastName,
  normalizeLrn,
  studentDisplayName,
} from "./student_auth.ts";

Deno.test("normalizeLrn strips non-digits", () => {
  assertEquals(normalizeLrn(" 1234-5678-9012 "), "123456789012");
});

Deno.test("isValidNormalizedLrn accepts only twelve digits", () => {
  assert(isValidNormalizedLrn("123456789012"));
  assertFalse(isValidNormalizedLrn("12345"));
});

Deno.test("normalizeClassCode and normalizeLastName uppercase trimmed values", () => {
  assertEquals(normalizeClassCode(" ab12cd "), "AB12CD");
  assertEquals(normalizeLastName(" dela   Cruz "), "DELA CRUZ");
});

Deno.test("buildStudentEmail and studentDisplayName stay deterministic", () => {
  assertEquals(buildStudentEmail("123456789012"), "student.123456789012@auth.mathventure.invalid");
  assertEquals(studentDisplayName(" dela Cruz "), "dela Cruz");
});
