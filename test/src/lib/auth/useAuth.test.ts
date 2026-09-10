import { assertEquals } from "jsr:@std/assert";
import { profileFromAuthSession, type AuthSessionLike } from "../../../../src/lib/auth/profile.ts";
import {
  buildAuthViewState,
  type AuthViewState,
} from "../../../../src/lib/auth/session-state.ts";

Deno.env.set("VITE_SUPABASE_URL", "https://example.supabase.co");
Deno.env.set("VITE_SUPABASE_ANON_KEY", "test-anon-key");

Deno.test("profileFromAuthSession maps an authenticated session without another auth request", () => {
  const session: AuthSessionLike = {
    user: {
      id: "teacher-1",
      user_metadata: {
        role: "teacher",
        full_name: "Ana Cruz",
      },
    },
  };

  assertEquals(profileFromAuthSession(session), {
    id: "teacher-1",
    role: "teacher",
    full_name: "Ana Cruz",
  });
  assertEquals(profileFromAuthSession(null), null);
});

Deno.test("student view keeps the teacher profile available while making the student active", () => {
  const teacher = { id: "teacher-1", role: "teacher" as const, full_name: "Ana Cruz" };
  const student = { id: "student-1", role: "student" as const, full_name: "Maria Santos" };

  const viewingState = buildAuthViewState(teacher, student);
  const returnedState = buildAuthViewState(viewingState.teacherUser, null);

  assertEquals(viewingState, {
    user: student,
    teacherUser: teacher,
    viewingStudent: student,
    isViewingStudent: true,
  } satisfies AuthViewState);
  assertEquals(returnedState, {
    user: teacher,
    teacherUser: teacher,
    viewingStudent: null,
    isViewingStudent: false,
  } satisfies AuthViewState);
});

const { returnToTeacherAccount } = await import("../../../../src/lib/auth/auth.ts");
type TeacherReturnDeps = import("../../../../src/lib/auth/auth.ts").TeacherReturnDeps;

Deno.test("returning to teacher verifies the teacher password before ending student mode", async () => {
  const calls: string[] = [];
  const deps: TeacherReturnDeps = {
    getTeacherEmail: async () => {
      calls.push("email");
      return "teacher@example.com";
    },
    verifyTeacherPassword: async (email, password) => {
      calls.push(`verify:${email}:${password}`);
      return null;
    },
    signOutStudent: async () => {
      calls.push("student-signout");
      return null;
    },
  };

  await returnToTeacherAccount("secret", deps);

  assertEquals(calls, [
    "email",
    "verify:teacher@example.com:secret",
    "student-signout",
  ]);
});

Deno.test("returning to teacher does not end student mode after a wrong password", async () => {
  let signedOut = false;
  let caughtMessage: string | null = null;
  const deps: TeacherReturnDeps = {
    getTeacherEmail: async () => "teacher@example.com",
    verifyTeacherPassword: async () => ({ message: "Invalid login credentials" }),
    signOutStudent: async () => {
      signedOut = true;
      return null;
    },
  };

  await (async () => {
    try {
      await returnToTeacherAccount("wrong", deps);
    } catch (error) {
      caughtMessage = (error as Error).message;
    }
  })();

  assertEquals(caughtMessage, "Incorrect teacher password.");
  assertEquals(signedOut, false);
});
