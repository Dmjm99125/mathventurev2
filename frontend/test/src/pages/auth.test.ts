import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/pages/auth.tsx", import.meta.url));

Deno.test("login exposes only teacher credentials", () => {
  assertEquals(source.includes("studentSignIn"), false);
  assertEquals(source.includes("setRole"), false);
  assertEquals(source.includes("teacherFirstName"), false);
  assertEquals(source.includes("lastName"), false);
  assertEquals(source.includes("firstName"), false);
});

Deno.test("signup keeps the immediate sign-in flow", () => {
  assertEquals(source.includes("await teacherSignUp(email, password, fullName);"), true);
  assertEquals(source.includes("await teacherSignIn(email, password);"), true);
});

Deno.test("auth pages expose recovery request and six-digit reset controls", () => {
  assertEquals(source.includes("export function ForgotPassword()"), true);
  assertEquals(source.includes("export function PasswordReset()"), true);
  assertEquals(source.includes("requestTeacherPasswordReset"), true);
  assertEquals(source.includes("verifyTeacherPasswordResetOtp"), true);
  assertEquals(source.includes('inputMode="numeric"'), true);
  assertEquals(source.includes("maxLength={PASSWORD_RESET_OTP_LENGTH}"), true);
});

Deno.test("password reset retains a verified recovery session for password retries", () => {
  assertEquals(source.includes("if (!isOtpVerified)"), true);
  assertEquals(source.includes("setIsOtpVerified(true)"), true);
});
