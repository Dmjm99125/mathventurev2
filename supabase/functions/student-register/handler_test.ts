import { assertEquals } from "jsr:@std/assert";
import { createStudentRegisterHandler } from "./handler.ts";

Deno.test("student-register reuses a pre-provisioned student in the teacher classroom", async () => {
  const calls: string[] = [];
  const handler = createStudentRegisterHandler({
    findTeacherClassByFirstName: async () => ({ teacherId: "teacher-1", classId: "classroom-1" }),
    findExistingStudentEmailInClass: async () => "student.preprovisioned@auth.mathventure.invalid",
    provisionStudentForClass: async () => {
      throw new Error("should not provision a second account");
    },
    issueStudentSession: async (email) => {
      calls.push(`issue:${email}`);
      return {
        status: "ok" as const,
        email,
        tokenHash: "token-hash",
        verifyType: "email" as const,
      };
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({
      teacherFirstName: "Ana",
      lastName: "Santos",
      firstName: "Maria",
    }),
  }));

  assertEquals(response.status, 201);
  assertEquals(calls, ["issue:student.preprovisioned@auth.mathventure.invalid"]);
});

Deno.test("student-register provisions a hidden student when no teacher-classroom match exists for the student", async () => {
  const calls: string[] = [];
  const handler = createStudentRegisterHandler({
    findTeacherClassByFirstName: async () => ({ teacherId: "teacher-1", classId: "classroom-1" }),
    findExistingStudentEmailInClass: async () => null,
    provisionStudentForClass: async () => {
      calls.push("provision");
      return {
        studentId: "student-1",
        email: "student.generated@auth.mathventure.invalid",
      };
    },
    issueStudentSession: async (email) => {
      calls.push(`issue:${email}`);
      return {
        status: "ok" as const,
        email,
        tokenHash: "token-hash",
        verifyType: "email" as const,
      };
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({
      teacherFirstName: "Ana",
      lastName: "Santos",
      firstName: "Maria",
    }),
  }));

  assertEquals(response.status, 201);
  assertEquals(calls, ["provision", "issue:student.generated@auth.mathventure.invalid"]);
});

Deno.test("student-register returns 404 when the teacher classroom is unknown", async () => {
  const handler = createStudentRegisterHandler({
    findTeacherClassByFirstName: async () => null,
    findExistingStudentEmailInClass: async () => {
      throw new Error("should not search students without a teacher classroom");
    },
    provisionStudentForClass: async () => {
      throw new Error("should not provision a student");
    },
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({
      teacherFirstName: "Missing",
      lastName: "Santos",
      firstName: "Maria",
    }),
  }));

  assertEquals(response.status, 404);
  assertEquals(await response.json(), {
    error: "We couldn't find that teacher classroom.",
  });
});

Deno.test("student-register returns 409 when matching the student in the teacher classroom is ambiguous", async () => {
  const handler = createStudentRegisterHandler({
    findTeacherClassByFirstName: async () => ({ teacherId: "teacher-1", classId: "classroom-1" }),
    findExistingStudentEmailInClass: async () => "ambiguous",
    provisionStudentForClass: async () => {
      throw new Error("should not provision a student");
    },
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({
      teacherFirstName: "Ana",
      lastName: "Santos",
      firstName: "Maria",
    }),
  }));

  assertEquals(response.status, 409);
  assertEquals(await response.json(), {
    error: "We couldn't resolve that student in the teacher classroom.",
  });
});

Deno.test("student-register returns a JSON 500 with CORS headers when a dependency throws", async () => {
  const handler = createStudentRegisterHandler({
    findTeacherClassByFirstName: async () => {
      throw new Error("boom");
    },
    findExistingStudentEmailInClass: async () => null,
    provisionStudentForClass: async () => {
      throw new Error("should not provision a student");
    },
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({
      teacherFirstName: "Ana",
      lastName: "Santos",
      firstName: "Maria",
    }),
  }));

  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(await response.json(), { error: "We couldn't register that student right now." });
});
