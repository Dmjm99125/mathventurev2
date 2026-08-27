import { assertEquals } from "jsr:@std/assert";
import { profileFromAuthSession, type AuthSessionLike } from "../../../../src/lib/auth/profile.ts";

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
