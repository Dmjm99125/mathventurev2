import { assertEquals } from "jsr:@std/assert";
import {
  normalizeStudentIdentity,
  provisionHiddenStudentForClass,
} from "./hidden_student_provision.ts";

Deno.test("normalizeStudentIdentity trims names and computes normalized fields", () => {
  assertEquals(
    normalizeStudentIdentity({
      lastName: " Dela  Cruz ",
      firstName: " Maria ",
    }),
    {
      rawLastName: "Dela Cruz",
      rawFirstName: "Maria",
      normalizedLastName: "DELA CRUZ",
      normalizedFirstName: "MARIA",
      fullName: "Dela Cruz, Maria",
    },
  );

  assertEquals(
    normalizeStudentIdentity({ lastName: " ", firstName: "Maria" }),
    null,
  );
});

Deno.test("provisionHiddenStudentForClass creates the auth user, updates the profile, and enrolls the class", async () => {
  const calls: string[] = [];

  const created = await provisionHiddenStudentForClass(
    {
      createHiddenStudent: async () => {
        calls.push("createHiddenStudent");
        return {
          id: "student-1",
          email: "student.one@auth.mathventure.invalid",
        };
      },
      updateStudentProfile: async () => {
        calls.push("updateStudentProfile");
      },
      enrollStudent: async () => {
        calls.push("enrollStudent");
      },
    },
    {
      classId: "class-1",
      identity: {
        rawLastName: "Santos",
        rawFirstName: "Maria",
        normalizedLastName: "SANTOS",
        normalizedFirstName: "MARIA",
        fullName: "Santos, Maria",
      },
    },
  );

  assertEquals(created, {
    studentId: "student-1",
    email: "student.one@auth.mathventure.invalid",
  });
  assertEquals(calls, [
    "createHiddenStudent",
    "updateStudentProfile",
    "enrollStudent",
  ]);
});
