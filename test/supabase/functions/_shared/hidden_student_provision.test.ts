import { assertEquals, assertRejects } from "jsr:@std/assert";
import {
  findExistingStudentEmailInClass,
  findStudentEmailByTeacherAndName,
  findTeacherClassByFirstName,
  normalizeStudentIdentity,
  provisionHiddenStudentForClass,
} from "../../../../supabase/functions/_shared/hidden_student_provision.ts";
import { HIDDEN_CLASSROOM_NAME } from "../../../../supabase/functions/_shared/teacher_singleton_class.ts";

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

Deno.test("findTeacherClassByFirstName resolves a single teacher classroom", async () => {
  const match = await findTeacherClassByFirstName(
    {
      listTeachersByNormalizedFirstName: async () => [{ id: "teacher-1" }],
      listTeacherClasses: async () => [
        {
          id: "classroom-1",
          teacherId: "teacher-1",
          name: HIDDEN_CLASSROOM_NAME,
          createdAt: "2026-07-31T00:00:00.000Z",
        },
      ],
    },
    "ANA",
  );

  assertEquals(match, {
    teacherId: "teacher-1",
    classId: "classroom-1",
  });
});

Deno.test("findTeacherClassByFirstName returns ambiguous when multiple teachers share the first name", async () => {
  const match = await findTeacherClassByFirstName(
    {
      listTeachersByNormalizedFirstName: async () => [
        { id: "teacher-1" },
        { id: "teacher-2" },
      ],
      listTeacherClasses: async () => {
        throw new Error("should not resolve classrooms for ambiguous teachers");
      },
    },
    "ANA",
  );

  assertEquals(match, "ambiguous");
});

Deno.test("findExistingStudentEmailInClass returns ambiguous when multiple students share the same name in one classroom", async () => {
  const email = await findExistingStudentEmailInClass(
    {
      listStudentIdsInClassByNormalizedName: async () => [
        "student-1",
        "student-2",
      ],
      getStudentEmail: async () => {
        throw new Error("should not load email for ambiguous student matches");
      },
    },
    {
      classId: "classroom-1",
      normalizedLastName: "SANTOS",
      normalizedFirstName: "MARIA",
    },
  );

  assertEquals(email, "ambiguous");
});

Deno.test("findStudentEmailByTeacherAndName scopes the student lookup to the teacher classroom", async () => {
  const calls: string[] = [];

  const email = await findStudentEmailByTeacherAndName(
    {
      listTeachersByNormalizedFirstName: async () => [{ id: "teacher-1" }],
      listTeacherClasses: async () => [
        {
          id: "classroom-1",
          teacherId: "teacher-1",
          name: HIDDEN_CLASSROOM_NAME,
          createdAt: "2026-07-31T00:00:00.000Z",
        },
      ],
      listStudentIdsInClassByNormalizedName: async () => {
        calls.push("listStudentIdsInClassByNormalizedName");
        return ["student-1"];
      },
      getStudentEmail: async (studentId: string) => {
        calls.push(`getStudentEmail:${studentId}`);
        return "student.test-key@auth.mathventure.invalid";
      },
    },
    {
      normalizedTeacherFirstName: "ANA",
      normalizedLastName: "SANTOS",
      normalizedFirstName: "MARIA",
    },
  );

  assertEquals(email, "student.test-key@auth.mathventure.invalid");
  assertEquals(calls, [
    "listStudentIdsInClassByNormalizedName",
    "getStudentEmail:student-1",
  ]);
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
      deleteHiddenStudent: async () => {
        calls.push("deleteHiddenStudent");
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

Deno.test("provisionHiddenStudentForClass deletes the created auth user when profile update fails", async () => {
  const calls: string[] = [];

  await assertRejects(
    () =>
      provisionHiddenStudentForClass(
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
            throw new Error("profile boom");
          },
          enrollStudent: async () => {
            calls.push("enrollStudent");
          },
          deleteHiddenStudent: async () => {
            calls.push("deleteHiddenStudent");
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
      ),
    Error,
    "profile boom",
  );

  assertEquals(calls, [
    "createHiddenStudent",
    "updateStudentProfile",
    "deleteHiddenStudent",
  ]);
});
