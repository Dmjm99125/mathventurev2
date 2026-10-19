import { assertEquals, assertThrows } from "jsr:@std/assert";
import {
  formatTeacherAddStudentsCount,
  normalizeTeacherAddStudentRows,
  parseTeacherStudentsJson,
  parseTeacherStudentsWorksheet,
} from "../../../../../src/lib/teacher/add-students/index.ts";

Deno.test("formatTeacherAddStudentsCount describes one and larger manual batches", () => {
  assertEquals(formatTeacherAddStudentsCount(1), "1 student");
  assertEquals(formatTeacherAddStudentsCount(9), "9 students");
});

Deno.test("normalizeTeacherAddStudentRows trims names and rejects incomplete rows", () => {
  assertEquals(
    normalizeTeacherAddStudentRows([
      { lastName: "  Dela   Cruz ", firstName: "  Juan  " },
      { lastName: " Santos", firstName: "Maria " },
    ]),
    [
      { lastName: "Dela Cruz", firstName: "Juan" },
      { lastName: "Santos", firstName: "Maria" },
    ],
  );

  assertThrows(
    () =>
      normalizeTeacherAddStudentRows([
        { lastName: "Only", firstName: "   " },
      ]),
    Error,
    "Every student row needs both Last Name and First Name.",
  );
});

Deno.test("parseTeacherStudentsJson accepts only the strict lastName/firstName array shape", () => {
  assertEquals(
    parseTeacherStudentsJson('[{"lastName":" Santos ","firstName":" Maria "}]'),
    [{ lastName: "Santos", firstName: "Maria" }],
  );

  assertThrows(
    () => parseTeacherStudentsJson('{"lastName":"Santos"}'),
    Error,
    "Upload a JSON array of objects with only lastName and firstName.",
  );

  assertThrows(
    () =>
      parseTeacherStudentsJson(
        '[{"lastName":"Santos","firstName":"Maria","section":"A"}]',
      ),
    Error,
    "Upload a JSON array of objects with only lastName and firstName.",
  );
});

Deno.test("parseTeacherStudentsWorksheet enforces the exact xlsx header row", () => {
  assertEquals(
    parseTeacherStudentsWorksheet([
      ["lastName", "firstName"],
      [" Santos ", " Maria "],
      ["Cruz", "Paolo"],
    ]),
    [
      { lastName: "Santos", firstName: "Maria" },
      { lastName: "Cruz", firstName: "Paolo" },
    ],
  );

  assertThrows(
    () =>
      parseTeacherStudentsWorksheet([
        ["Last Name", "First Name"],
        ["Santos", "Maria"],
      ]),
    Error,
    "Use the exact XLSX columns: lastName, firstName.",
  );
});
