import { assertEquals } from "jsr:@std/assert";
import { buildVerifyOtpParams, isStudentSessionPayload } from "./student-auth.ts";

Deno.test("buildVerifyOtpParams maps tokenHash to Supabase verifyOtp input", () => {
  assertEquals(
    buildVerifyOtpParams({
      status: "ok",
      email: "student.123456789012@auth.mathventure.invalid",
      tokenHash: "hashed-token",
      verifyType: "email",
    }),
    { token_hash: "hashed-token", type: "email" },
  );
});

Deno.test("isStudentSessionPayload narrows only successful responses", () => {
  assertEquals(
    isStudentSessionPayload({
      status: "ok",
      email: "a",
      tokenHash: "b",
      verifyType: "email",
    }),
    true,
  );
  assertEquals(isStudentSessionPayload({ status: "already_registered" }), false);
});
