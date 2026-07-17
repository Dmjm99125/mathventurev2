# Student LRN Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace student email/password auth with LRN-based signup/login on the shared auth pages while preserving the existing teacher flow and the app's normal Supabase session model.

**Architecture:** Add student LRN and last-name columns via a new migration, introduce shared normalization helpers plus two public Supabase Edge Functions (`student-register` and `student-login`) that validate student inputs and mint one-time token-hash sign-ins for hidden auth users, then update the React auth layer and shared auth page to route teacher and student flows through the correct backend paths.

**Tech Stack:** React 19, Wouter, Vite, TypeScript, Supabase JS v2, Supabase Edge Functions on Deno, SQL migrations.

## Global Constraints

- This is intentionally low-assurance auth for a short-lived deployment window.
- The app may trust knowledge of `LRN + Last Name` for student login.
- Child-facing copy must stay simple and must not mention OTPs, tokens, synthetic emails, or hidden accounts.
- Backend changes must follow the repo rule that prior Supabase schema is assumed applied already; schema evolution happens in new migration files only.
- Teacher auth stays exactly where it is today: `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`.
- `Class Code` is required only during student signup to establish class enrollment.

## File Map

- Create: `supabase/migrations/0002_student_lrn_auth.sql`
  Adds student LRN and last-name columns plus the student-only indexes needed for exact LRN lookups.
- Create: `supabase/functions/_shared/student_auth.ts`
  Holds normalization helpers, synthetic-email generation, response types, and shared constants for student auth functions.
- Create: `supabase/functions/_shared/student_auth_test.ts`
  Deno tests for normalization and synthetic-email helper behavior.
- Create: `supabase/functions/student-register/handler.ts`
  Testable request handler for student signup and session bootstrap.
- Create: `supabase/functions/student-register/index.ts`
  Thin Deno entrypoint that wires the handler to `Deno.serve`.
- Create: `supabase/functions/student-register/handler_test.ts`
  Deno tests for student registration success, duplicate LRN rejection, and invalid class code handling.
- Create: `supabase/functions/student-login/handler.ts`
  Testable request handler for LRN + last-name login and session bootstrap.
- Create: `supabase/functions/student-login/index.ts`
  Thin Deno entrypoint that wires the login handler to `Deno.serve`.
- Create: `supabase/functions/student-login/handler_test.ts`
  Deno tests for login success, unknown LRN, and wrong-last-name failure.
- Create: `src/lib/student-auth.ts`
  Pure browser-safe helpers and shared response types for completing student auth from returned token hashes.
- Create: `src/lib/student-auth.test.ts`
  Deno tests for browser-safe student auth helper behavior.
- Modify: `src/lib/api.ts`
  Exports the shared function-invocation helper plus typed student-auth response shapes.
- Modify: `src/lib/auth.ts`
  Keeps teacher auth intact and adds role-specific student signup/login wrappers that call Edge Functions and complete `verifyOtp({ token_hash, type: "email" })` automatically.
- Modify: `src/pages/auth.tsx`
  Converts the shared login page to role-aware fields and updates signup to student LRN/class-code/last-name fields.
- Modify: `src/lib/useLanguage.tsx`
  Adds LRN and student-auth copy in English and Tagalog.

### Task 1: Add Student Auth Schema And Shared Helpers

**Files:**
- Create: `supabase/migrations/0002_student_lrn_auth.sql`
- Create: `supabase/functions/_shared/student_auth.ts`
- Test: `supabase/functions/_shared/student_auth_test.ts`

**Interfaces:**
- Produces: `normalizeLrn(input: string): string`
- Produces: `isValidNormalizedLrn(normalizedLrn: string): boolean`
- Produces: `normalizeClassCode(input: string): string`
- Produces: `normalizeLastName(input: string): string`
- Produces: `buildStudentEmail(normalizedLrn: string): string`
- Produces: `studentDisplayName(lastName: string): string`
- Produces: `STUDENT_VERIFY_TYPE = 'email'`

- [ ] **Step 1: Write the failing shared-helper tests**

```ts
// supabase/functions/_shared/student_auth_test.ts
import { assertEquals, assertFalse, assertTrue } from "jsr:@std/assert";
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
  assertTrue(isValidNormalizedLrn("123456789012"));
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
```

- [ ] **Step 2: Run the shared-helper tests to verify they fail**

Run: `deno test supabase/functions/_shared/student_auth_test.ts`

Expected: FAIL with `Cannot resolve module "./student_auth.ts"` or missing export errors.

- [ ] **Step 3: Write the migration and shared helper module**

```sql
-- supabase/migrations/0002_student_lrn_auth.sql
alter table public.profiles
  add column if not exists lrn text,
  add column if not exists normalized_lrn text,
  add column if not exists last_name text,
  add column if not exists normalized_last_name text;

create unique index if not exists profiles_student_normalized_lrn_uidx
  on public.profiles (normalized_lrn)
  where role = 'student' and normalized_lrn is not null;

create index if not exists profiles_student_normalized_last_name_idx
  on public.profiles (normalized_last_name)
  where role = 'student' and normalized_last_name is not null;
```

```ts
// supabase/functions/_shared/student_auth.ts
export const STUDENT_VERIFY_TYPE = "email" as const;

export function normalizeLrn(input: string): string {
  return input.replace(/\D/g, "");
}

export function isValidNormalizedLrn(normalizedLrn: string): boolean {
  return /^\d{12}$/.test(normalizedLrn);
}

export function normalizeClassCode(input: string): string {
  return input.trim().toUpperCase();
}

export function normalizeLastName(input: string): string {
  return input.trim().replace(/\s+/g, " ").toUpperCase();
}

export function studentDisplayName(lastName: string): string {
  return lastName.trim().replace(/\s+/g, " ") || "Student";
}

export function buildStudentEmail(normalizedLrn: string): string {
  return `student.${normalizedLrn}@auth.mathventure.invalid`;
}
```

- [ ] **Step 4: Run the shared-helper tests to verify they pass**

Run: `deno test supabase/functions/_shared/student_auth_test.ts`

Expected: PASS with 4 tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0002_student_lrn_auth.sql supabase/functions/_shared/student_auth.ts supabase/functions/_shared/student_auth_test.ts
git commit -m "feat: add student LRN auth schema helpers"
```

### Task 2: Implement Student Registration Edge Function

**Files:**
- Create: `supabase/functions/student-register/handler.ts`
- Create: `supabase/functions/student-register/index.ts`
- Test: `supabase/functions/student-register/handler_test.ts`

**Interfaces:**
- Consumes: `normalizeLrn(input: string): string`
- Consumes: `normalizeClassCode(input: string): string`
- Consumes: `normalizeLastName(input: string): string`
- Consumes: `buildStudentEmail(normalizedLrn: string): string`
- Produces: `createStudentRegisterHandler(deps: StudentRegisterDeps): (req: Request) => Promise<Response>`
- Produces: success response `{ status: "ok"; email: string; tokenHash: string; verifyType: "email" }`
- Produces: duplicate response `{ status: "already_registered" }`

- [ ] **Step 1: Write the failing student-register tests**

```ts
// supabase/functions/student-register/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createStudentRegisterHandler } from "./handler.ts";

Deno.test("student-register returns already_registered when the LRN already exists", async () => {
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => ({ id: "class-1", name: "Section A" }),
    findStudentByNormalizedLrn: async () => ({ id: "student-1" }),
    createHiddenStudent: async () => { throw new Error("should not create user"); },
    updateStudentProfile: async () => {},
    enrollStudent: async () => {},
    issueStudentSession: async () => { throw new Error("should not issue session"); },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ lrn: "1234-5678-9012", classCode: "abc123", lastName: "Dela Cruz" }),
  }));

  assertEquals(response.status, 409);
  assertEquals(await response.json(), { status: "already_registered" });
});

Deno.test("student-register returns 404 when the class code is unknown", async () => {
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => null,
    findStudentByNormalizedLrn: async () => null,
    createHiddenStudent: async () => { throw new Error("should not create user"); },
    updateStudentProfile: async () => {},
    enrollStudent: async () => {},
    issueStudentSession: async () => { throw new Error("should not issue session"); },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", classCode: "missing", lastName: "Santos" }),
  }));

  assertEquals(response.status, 404);
});

Deno.test("student-register creates a student, enrolls the class, and returns a token hash", async () => {
  const calls: string[] = [];
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => ({ id: "class-1", name: "Section A" }),
    findStudentByNormalizedLrn: async () => null,
    createHiddenStudent: async () => {
      calls.push("createHiddenStudent");
      return { id: "student-1", email: "student.123456789012@auth.mathventure.invalid" };
    },
    updateStudentProfile: async () => { calls.push("updateStudentProfile"); },
    enrollStudent: async () => { calls.push("enrollStudent"); },
    issueStudentSession: async () => {
      calls.push("issueStudentSession");
      return { status: "ok", email: "student.123456789012@auth.mathventure.invalid", tokenHash: "token-hash", verifyType: "email" as const };
    },
  });

  const response = await handler(new Request("http://local/student-register", {
    method: "POST",
    body: JSON.stringify({ lrn: "1234-5678-9012", classCode: "abc123", lastName: "Santos" }),
  }));

  assertEquals(response.status, 201);
  assertEquals(await response.json(), {
    status: "ok",
    email: "student.123456789012@auth.mathventure.invalid",
    tokenHash: "token-hash",
    verifyType: "email",
  });
  assertEquals(calls, ["createHiddenStudent", "updateStudentProfile", "enrollStudent", "issueStudentSession"]);
});
```

- [ ] **Step 2: Run the student-register tests to verify they fail**

Run: `deno test supabase/functions/student-register/handler_test.ts`

Expected: FAIL with `Cannot resolve module "./handler.ts"` or missing export errors.

- [ ] **Step 3: Write the register handler and entrypoint**

```ts
// supabase/functions/student-register/handler.ts
import { adminClient } from "../_shared/client.ts";
import { errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  buildStudentEmail,
  isValidNormalizedLrn,
  normalizeClassCode,
  normalizeLastName,
  normalizeLrn,
  STUDENT_VERIFY_TYPE,
  studentDisplayName,
} from "../_shared/student_auth.ts";

type StudentRegisterSession = {
  status: "ok";
  email: string;
  tokenHash: string;
  verifyType: typeof STUDENT_VERIFY_TYPE;
};

type StudentRegisterDeps = {
  findClassByCode(joinCode: string): Promise<{ id: string; name: string } | null>;
  findStudentByNormalizedLrn(normalizedLrn: string): Promise<{ id: string } | null>;
  createHiddenStudent(input: { normalizedLrn: string; rawLastName: string }): Promise<{ id: string; email: string }>;
  updateStudentProfile(input: { studentId: string; normalizedLrn: string; rawLastName: string; normalizedLastName: string }): Promise<void>;
  enrollStudent(input: { classId: string; studentId: string }): Promise<void>;
  issueStudentSession(email: string): Promise<StudentRegisterSession>;
};

const defaultDeps: StudentRegisterDeps = {
  async findClassByCode(joinCode) {
    const { data } = await adminClient.from("classes").select("id, name").eq("join_code", joinCode).maybeSingle();
    return data;
  },
  async findStudentByNormalizedLrn(normalizedLrn) {
    const { data } = await adminClient.from("profiles").select("id").eq("role", "student").eq("normalized_lrn", normalizedLrn).maybeSingle();
    return data;
  },
  async createHiddenStudent({ normalizedLrn, rawLastName }) {
    const email = buildStudentEmail(normalizedLrn);
    const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "student", full_name: studentDisplayName(rawLastName), last_name: rawLastName.trim(), lrn: normalizedLrn },
    });
    if (error || !data.user) throw error ?? new Error("Failed to create student auth user");
    return { id: data.user.id, email };
  },
  async updateStudentProfile({ studentId, normalizedLrn, rawLastName, normalizedLastName }) {
    const { error } = await adminClient.from("profiles").update({
      full_name: studentDisplayName(rawLastName),
      lrn: normalizedLrn,
      normalized_lrn: normalizedLrn,
      last_name: rawLastName.trim(),
      normalized_last_name: normalizedLastName,
    }).eq("id", studentId);
    if (error) throw error;
  },
  async enrollStudent({ classId, studentId }) {
    const { error } = await adminClient.from("class_students").insert({ class_id: classId, student_id: studentId });
    if (error) throw error;
  },
  async issueStudentSession(email) {
    const { data, error } = await adminClient.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data?.properties?.hashed_token) throw error ?? new Error("Failed to generate student magic link");
    return { status: "ok", email, tokenHash: data.properties.hashed_token, verifyType: STUDENT_VERIFY_TYPE };
  },
};

export function createStudentRegisterHandler(deps: StudentRegisterDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    const body = await req.json().catch(() => null);
    const normalizedLrn = normalizeLrn(typeof body?.lrn === "string" ? body.lrn : "");
    const normalizedClassCode = normalizeClassCode(typeof body?.classCode === "string" ? body.classCode : "");
    const rawLastName = typeof body?.lastName === "string" ? body.lastName : "";
    const normalizedLastName = normalizeLastName(rawLastName);

    if (!isValidNormalizedLrn(normalizedLrn)) return errorResponse("Check your learner number and try again.", 422);
    if (!normalizedClassCode) return errorResponse("We couldn't find that class code.", 422);
    if (!normalizedLastName) return errorResponse("We couldn't sign you in right now.", 422);

    const existingStudent = await deps.findStudentByNormalizedLrn(normalizedLrn);
    if (existingStudent) return jsonResponse({ status: "already_registered" }, 409);

    const klass = await deps.findClassByCode(normalizedClassCode);
    if (!klass) return errorResponse("We couldn't find that class code.", 404);

    const created = await deps.createHiddenStudent({ normalizedLrn, rawLastName });
    await deps.updateStudentProfile({
      studentId: created.id,
      normalizedLrn,
      rawLastName,
      normalizedLastName,
    });
    await deps.enrollStudent({ classId: klass.id, studentId: created.id });

    return jsonResponse(await deps.issueStudentSession(created.email), 201);
  };
}
```

```ts
// supabase/functions/student-register/index.ts
import { createStudentRegisterHandler } from "./handler.ts";

const handler = createStudentRegisterHandler();

Deno.serve((req) => handler(req));
```

- [ ] **Step 4: Run the student-register tests to verify they pass**

Run: `deno test supabase/functions/student-register/handler_test.ts`

Expected: PASS with 3 tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/student-register/handler.ts supabase/functions/student-register/index.ts supabase/functions/student-register/handler_test.ts
git commit -m "feat: add student registration function"
```

### Task 3: Implement Student Login Edge Function

**Files:**
- Create: `supabase/functions/student-login/handler.ts`
- Create: `supabase/functions/student-login/index.ts`
- Test: `supabase/functions/student-login/handler_test.ts`

**Interfaces:**
- Consumes: `normalizeLrn(input: string): string`
- Consumes: `normalizeLastName(input: string): string`
- Consumes: `buildStudentEmail(normalizedLrn: string): string`
- Produces: `createStudentLoginHandler(deps: StudentLoginDeps): (req: Request) => Promise<Response>`
- Produces: success response `{ status: "ok"; email: string; tokenHash: string; verifyType: "email" }`
- Produces: login failure response `{ status: "invalid_credentials" }`

- [ ] **Step 1: Write the failing student-login tests**

```ts
// supabase/functions/student-login/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createStudentLoginHandler } from "./handler.ts";

Deno.test("student-login returns invalid_credentials when the LRN is unknown", async () => {
  const handler = createStudentLoginHandler({
    findStudentByNormalizedLrn: async () => null,
    issueStudentSession: async () => { throw new Error("should not issue session"); },
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", lastName: "Santos" }),
  }));

  assertEquals(response.status, 401);
  assertEquals(await response.json(), { status: "invalid_credentials" });
});

Deno.test("student-login returns invalid_credentials when the last name does not match", async () => {
  const handler = createStudentLoginHandler({
    findStudentByNormalizedLrn: async () => ({ normalizedLastName: "DELA CRUZ" }),
    issueStudentSession: async () => { throw new Error("should not issue session"); },
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", lastName: "Santos" }),
  }));

  assertEquals(response.status, 401);
});

Deno.test("student-login returns a token hash when the last name matches", async () => {
  const handler = createStudentLoginHandler({
    findStudentByNormalizedLrn: async () => ({ normalizedLastName: "SANTOS" }),
    issueStudentSession: async () => ({
      status: "ok",
      email: "student.123456789012@auth.mathventure.invalid",
      tokenHash: "token-hash",
      verifyType: "email" as const,
    }),
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({ lrn: "123456789012", lastName: "Santos" }),
  }));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    status: "ok",
    email: "student.123456789012@auth.mathventure.invalid",
    tokenHash: "token-hash",
    verifyType: "email",
  });
});
```

- [ ] **Step 2: Run the student-login tests to verify they fail**

Run: `deno test supabase/functions/student-login/handler_test.ts`

Expected: FAIL with `Cannot resolve module "./handler.ts"` or missing export errors.

- [ ] **Step 3: Write the login handler and entrypoint**

```ts
// supabase/functions/student-login/handler.ts
import { adminClient } from "../_shared/client.ts";
import { errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  buildStudentEmail,
  isValidNormalizedLrn,
  normalizeLastName,
  normalizeLrn,
  STUDENT_VERIFY_TYPE,
} from "../_shared/student_auth.ts";

type StudentLoginSession = {
  status: "ok";
  email: string;
  tokenHash: string;
  verifyType: typeof STUDENT_VERIFY_TYPE;
};

type StudentLoginDeps = {
  findStudentByNormalizedLrn(normalizedLrn: string): Promise<{ normalizedLastName: string } | null>;
  issueStudentSession(email: string): Promise<StudentLoginSession>;
};

const defaultDeps: StudentLoginDeps = {
  async findStudentByNormalizedLrn(normalizedLrn) {
    const { data } = await adminClient.from("profiles")
      .select("normalized_last_name")
      .eq("role", "student")
      .eq("normalized_lrn", normalizedLrn)
      .maybeSingle();
    return data;
  },
  async issueStudentSession(email) {
    const { data, error } = await adminClient.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data?.properties?.hashed_token) throw error ?? new Error("Failed to generate student magic link");
    return { status: "ok", email, tokenHash: data.properties.hashed_token, verifyType: STUDENT_VERIFY_TYPE };
  },
};

export function createStudentLoginHandler(deps: StudentLoginDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    const body = await req.json().catch(() => null);
    const normalizedLrn = normalizeLrn(typeof body?.lrn === "string" ? body.lrn : "");
    const normalizedLastName = normalizeLastName(typeof body?.lastName === "string" ? body.lastName : "");

    if (!isValidNormalizedLrn(normalizedLrn) || !normalizedLastName) {
      return jsonResponse({ status: "invalid_credentials" }, 401);
    }

    const student = await deps.findStudentByNormalizedLrn(normalizedLrn);
    if (!student || student.normalizedLastName !== normalizedLastName) {
      return jsonResponse({ status: "invalid_credentials" }, 401);
    }

    return jsonResponse(await deps.issueStudentSession(buildStudentEmail(normalizedLrn)));
  };
}
```

```ts
// supabase/functions/student-login/index.ts
import { createStudentLoginHandler } from "./handler.ts";

const handler = createStudentLoginHandler();

Deno.serve((req) => handler(req));
```

- [ ] **Step 4: Run the student-login tests to verify they pass**

Run: `deno test supabase/functions/student-login/handler_test.ts`

Expected: PASS with 3 tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/student-login/handler.ts supabase/functions/student-login/index.ts supabase/functions/student-login/handler_test.ts
git commit -m "feat: add student login function"
```

### Task 4: Update Frontend Student Auth Transport Layer

**Files:**
- Create: `src/lib/student-auth.ts`
- Create: `src/lib/student-auth.test.ts`
- Modify: `src/lib/api.ts`
- Modify: `src/lib/auth.ts`

**Interfaces:**
- Produces: `type StudentSessionPayload = { status: "ok"; email: string; tokenHash: string; verifyType: "email" }`
- Produces: `type StudentRegisterResponse = StudentSessionPayload | { status: "already_registered" }`
- Produces: `type StudentLoginResponse = StudentSessionPayload | { status: "invalid_credentials" }`
- Produces: `buildVerifyOtpParams(payload: StudentSessionPayload): { token_hash: string; type: "email" }`
- Produces: `teacherSignUp(email: string, password: string, fullName: string): Promise<unknown>`
- Produces: `teacherSignIn(email: string, password: string): Promise<unknown>`
- Produces: `studentRegister(input: { lrn: string; classCode: string; lastName: string }): Promise<unknown>`
- Produces: `studentSignIn(input: { lrn: string; lastName: string }): Promise<unknown>`

- [ ] **Step 1: Write the failing browser-safe student-auth helper tests**

```ts
// src/lib/student-auth.test.ts
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
    isStudentSessionPayload({ status: "ok", email: "a", tokenHash: "b", verifyType: "email" }),
    true,
  );
  assertEquals(isStudentSessionPayload({ status: "already_registered" }), false);
});
```

- [ ] **Step 2: Run the browser-safe student-auth helper tests to verify they fail**

Run: `deno test src/lib/student-auth.test.ts`

Expected: FAIL with `Cannot resolve module "./student-auth.ts"` or missing export errors.

- [ ] **Step 3: Implement the frontend student-auth helpers and role-aware auth wrappers**

```ts
// src/lib/student-auth.ts
export type StudentSessionPayload = {
  status: "ok";
  email: string;
  tokenHash: string;
  verifyType: "email";
};

export type StudentRegisterResponse =
  | StudentSessionPayload
  | { status: "already_registered" };

export type StudentLoginResponse =
  | StudentSessionPayload
  | { status: "invalid_credentials" };

export function isStudentSessionPayload(value: unknown): value is StudentSessionPayload {
  return typeof value === "object"
    && value !== null
    && (value as StudentSessionPayload).status === "ok"
    && typeof (value as StudentSessionPayload).tokenHash === "string";
}

export function buildVerifyOtpParams(payload: StudentSessionPayload) {
  return { token_hash: payload.tokenHash, type: payload.verifyType } as const;
}
```

```ts
// src/lib/api.ts
export async function invokeFunction<T>(
  name: string,
  options?: { method?: "GET" | "POST"; body?: Record<string, unknown>; searchParams?: Record<string, string> },
): Promise<T> {
  const query = options?.searchParams ? `?${new URLSearchParams(options.searchParams).toString()}` : "";
  const { data, error } = await supabase.functions.invoke(`${name}${query}`, {
    method: options?.method ?? "GET",
    body: options?.body,
  });
  if (error) {
    const message = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context
      ? await (error as any).context.json().then((j: any) => j?.error).catch(() => undefined)
      : undefined;
    throw new Error(message ?? error.message ?? "Request failed");
  }
  return data as T;
}
```

```ts
// src/lib/auth.ts
import { invokeFunction } from "./api";
import { buildVerifyOtpParams, type StudentLoginResponse, type StudentRegisterResponse, type StudentSessionPayload } from "./student-auth";

export async function teacherSignUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "teacher", full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function teacherSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function completeStudentSession(payload: StudentSessionPayload) {
  const { data, error } = await supabase.auth.verifyOtp(buildVerifyOtpParams(payload));
  if (error) throw error;
  return data;
}

export async function studentRegister(input: { lrn: string; classCode: string; lastName: string }) {
  const response = await invokeFunction<StudentRegisterResponse>("student-register", {
    method: "POST",
    body: input,
  });
  if (response.status === "already_registered") {
    throw new Error("You already have an account. Try logging in.");
  }
  return completeStudentSession(response);
}

export async function studentSignIn(input: { lrn: string; lastName: string }) {
  const response = await invokeFunction<StudentLoginResponse>("student-login", {
    method: "POST",
    body: input,
  });
  if (response.status === "invalid_credentials") {
    throw new Error("We couldn't sign you in with that information.");
  }
  return completeStudentSession(response);
}
```

- [ ] **Step 4: Run the helper tests and typecheck to verify they pass**

Run: `deno test src/lib/student-auth.test.ts`

Expected: PASS with 2 tests and 0 failures.

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/student-auth.ts src/lib/student-auth.test.ts src/lib/api.ts src/lib/auth.ts
git commit -m "feat: add frontend student auth transport"
```

### Task 5: Update Shared Auth UI, Translation Copy, And Final Verification

**Files:**
- Modify: `src/pages/auth.tsx`
- Modify: `src/lib/useLanguage.tsx`

**Interfaces:**
- Consumes: `teacherSignUp(email: string, password: string, fullName: string): Promise<unknown>`
- Consumes: `teacherSignIn(email: string, password: string): Promise<unknown>`
- Consumes: `studentRegister(input: { lrn: string; classCode: string; lastName: string }): Promise<unknown>`
- Consumes: `studentSignIn(input: { lrn: string; lastName: string }): Promise<unknown>`
- Produces: shared `/login` role toggle with student fields `LRN`, `Last Name`
- Produces: shared `/signup` student fields `LRN`, `Class Code`, `Last Name`

- [ ] **Step 1: Update auth-page state and translation keys for the new student flow**

```tsx
// src/pages/auth.tsx
import { studentRegister, studentSignIn, teacherSignIn, teacherSignUp } from "@/lib/auth";

const [role, setRole] = useState<Role>("student");
const [lrn, setLrn] = useState("");
const [classCode, setClassCode] = useState("");
const [lastName, setLastName] = useState("");

const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);
  try {
    if (role === "teacher") {
      await teacherSignIn(email, password);
    } else {
      await studentSignIn({ lrn, lastName });
    }
    await refreshProfile();
    setLocation("/");
  } catch (err: any) {
    setError(err.message || "Login failed");
  } finally {
    setLoading(false);
  }
};

const handleSignupSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);
  try {
    if (role === "teacher") {
      await teacherSignUp(email, password, fullName);
      await teacherSignIn(email, password);
    } else {
      await studentRegister({ lrn, classCode, lastName });
    }
    await refreshProfile();
    setLocation("/");
  } catch (err: any) {
    setError(err.message || "Signup failed");
  } finally {
    setLoading(false);
  }
};
```

```ts
// src/lib/useLanguage.tsx (English additions inside translations.en)
"auth.email": "Email",
"auth.password": "Password",
"auth.name": "Full Name",
"auth.lrn": "Learner Reference Number",
"auth.classCode": "Class Code",
"auth.lastName": "Last Name",
"auth.studentLoginHelp": "Use your learner number and last name.",
"auth.studentSignupHelp": "Use your learner number, class code, and last name.",

// src/lib/useLanguage.tsx (Tagalog additions inside translations.tl)
"auth.email": "Email",
"auth.password": "Password",
"auth.name": "Buong Pangalan",
"auth.lrn": "Learner Reference Number",
"auth.classCode": "Class Code",
"auth.lastName": "Apelyido",
"auth.studentLoginHelp": "Gamitin ang iyong learner number at apelyido.",
"auth.studentSignupHelp": "Gamitin ang iyong learner number, class code, at apelyido.",
```

- [ ] **Step 2: Render the conditional teacher vs student fields on the shared cards**

```tsx
// src/pages/auth.tsx
{role === "teacher" ? (
  <>
    <div className="space-y-2">
      <Label htmlFor="email">{t("auth.email")}</Label>
      <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">{t("auth.password")}</Label>
      <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
    </div>
  </>
) : (
  <>
    <p className="text-center text-sm font-bold text-muted-foreground">{t("auth.studentLoginHelp")}</p>
    <div className="space-y-2">
      <Label htmlFor="lrn">{t("auth.lrn")}</Label>
      <Input id="lrn" inputMode="numeric" required value={lrn} onChange={(e) => setLrn(e.target.value)} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastName">{t("auth.lastName")}</Label>
      <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
    </div>
  </>
)}
```

```tsx
// src/pages/auth.tsx (signup-only student section)
{role === "student" && (
  <>
    <p className="text-center text-sm font-bold text-muted-foreground">{t("auth.studentSignupHelp")}</p>
    <div className="space-y-2">
      <Label htmlFor="lrn">{t("auth.lrn")}</Label>
      <Input id="lrn" inputMode="numeric" required value={lrn} onChange={(e) => setLrn(e.target.value)} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="classCode">{t("auth.classCode")}</Label>
      <Input id="classCode" required value={classCode} onChange={(e) => setClassCode(e.target.value)} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastName">{t("auth.lastName")}</Label>
      <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
    </div>
  </>
)}
```

- [ ] **Step 3: Run the build and backend tests to verify the integrated flow stays green**

Run: `deno test supabase/functions/_shared/student_auth_test.ts`

Expected: PASS.

Run: `deno test supabase/functions/student-register/handler_test.ts`

Expected: PASS.

Run: `deno test supabase/functions/student-login/handler_test.ts`

Expected: PASS.

Run: `deno test src/lib/student-auth.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS and emit the production bundle without TypeScript or Vite errors.

- [ ] **Step 4: Perform the manual smoke checks**

Run these flows against the local app + Supabase environment:

```text
1. Teacher signup with email/password still lands on /teacher after refreshProfile().
2. Teacher login with email/password still lands on /teacher.
3. Student signup with LRN + Class Code + Last Name lands on /student.
4. Student login with matching LRN + Last Name lands on /student.
5. Student login with the wrong last name shows "We couldn't sign you in with that information."
6. Student signup with an already-registered LRN shows "You already have an account. Try logging in."
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/auth.tsx src/lib/useLanguage.tsx
git commit -m "feat: add shared student LRN auth UI"
```
