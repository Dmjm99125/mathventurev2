import { assertEquals } from "jsr:@std/assert";
import { profileFromAuthSession, type AuthSessionLike } from "../../../../src/lib/auth/profile.ts";
import {
  buildAuthViewState,
  type AuthViewState,
} from "../../../../src/lib/auth/session-state.ts";

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
