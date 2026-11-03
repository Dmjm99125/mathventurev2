# Teacher View Student Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make login teacher-only and let an authenticated teacher reversibly view a roster student's normal account, dashboard, and quizzes through an isolated browser session.

**Architecture:** Keep the existing teacher Supabase client as the primary session and add a second Supabase client backed by a separate tab-scoped storage key for the selected student. A new teacher-authorized Edge Function will verify classroom membership and issue the student session payload. The auth provider and API wrapper will select the active client, while the teacher client remains available for returning to teacher mode.

**Tech Stack:** React 19, TypeScript, Vite, Wouter, TanStack Query, Supabase Auth, Supabase Edge Functions, Deno tests, Tailwind CSS.

## Global Constraints

- The public login flow accepts teacher credentials only.
- A teacher may view only a student who belongs to that teacher's classroom.
- Preserve the teacher session while the student account is active.
- Store the student session separately and scope it to the current browser tab.
- Disable public name-based student login.
- Keep existing add-student, assignment, quiz, reports, typecheck, build, and test coverage.
- Do not use focused, skipped, weakened, or swallowed tests.
- Run targeted checks first, then the full relevant local gate before completion.

---

## File map

### Create

- `src/lib/supabase/student-client.ts` — construct the isolated browser-only Supabase client using `sessionStorage` and a distinct auth storage key.
- `supabase/functions/student-view-as/index.ts` — Deno entry point for the teacher-authorized view-as function.
- `supabase/functions/student-view-as/handler.ts` — injectable authorization, student-email lookup, and session issuance handler.
- `test/supabase/functions/student-view-as/handler.test.ts` — authorization and response tests for the new Edge Function.

### Modify

- `src/lib/supabase/client.ts` — expose the shared Supabase URL and anon key needed by both browser clients without duplicating environment parsing.
- `src/lib/api/client.ts` — allow function invocation through the active client and explicitly through the teacher client.
- `src/lib/auth/auth.ts` — add teacher-client and student-client session operations.
- `src/lib/auth/useAuth.tsx` — track active teacher/student view state and session transitions.
- `src/lib/auth/index.ts` — export the new auth types and operations needed by UI components.
- `src/lib/auth/student-auth.ts` — reuse session-payload validation for teacher-authorized view-as responses.
- `src/pages/auth.tsx` — remove student role selection and name-based login fields.
- `src/components/teacher/TeacherStudentListTable.tsx` — add the `View Account` action.
- `src/pages/teacher.tsx` — connect roster actions to the view-as operation and invalidate/refetch role-sensitive data.
- `src/components/layout.tsx` — show student-view state and the return-to-teacher control.
- `src/App.tsx` — redirect invalid student/teacher destinations when active view mode changes, if required by the existing route behavior.
- `supabase/functions/student-login/handler.ts` — reject the old public name-based login contract.
- `test/supabase/functions/student-login/handler.test.ts` — replace obsolete success-path tests with rejection tests.
- `test/src/lib/auth/student-auth.test.ts` — cover view-as payload validation if the shared type is extended.
- `test/src/lib/auth/useAuth.test.ts` — cover active profile/session transitions using injected client dependencies or pure transition helpers.
- Add focused UI tests beside existing page/component tests if the repository’s current test setup supports rendering these components; otherwise cover the behavior through pure helpers and handler tests without weakening existing coverage.

## Task 1: Add isolated browser clients and active API routing

**Files:**

- Create: `src/lib/supabase/student-client.ts`
- Modify: `src/lib/supabase/client.ts`
- Modify: `src/lib/api/client.ts`
- Test: `test/src/lib/auth/useAuth.test.ts` or a new `test/src/lib/api/client.test.ts`

**Interfaces:**

- Produce `supabaseUrl`, `supabaseAnonKey`, `supabase`, and `studentSupabase` exports.
- Produce `type AuthClient = typeof supabase`.
- Change `invokeFunction` to accept an optional client without breaking current callers:

```ts
export async function invokeFunction<T>(
  name: string,
  options?: InvokeFunctionOptions,
  client: AuthClient = supabase,
): Promise<T>;
```

- Produce `invokeTeacherFunction<T>(name, options)` as an explicit wrapper using the primary teacher client.
- Produce an active-client setter/getter or equivalent auth-context-owned request selector with this invariant: normal app API calls use the student client only while student view is active, and teacher transition calls always use the primary client.

- [ ] **Step 1: Write failing tests for client selection.**

Use a fake client with a recording `functions.invoke` method and assert that default calls use the primary client, explicit teacher calls use the primary client, and active student calls use the secondary client.

```ts
Deno.test("invokeFunction can use an explicitly selected auth client", async () => {
  const calls: string[] = [];
  const studentClient = {
    functions: {
      invoke: async () => {
        calls.push("student");
        return { data: { ok: true }, error: null };
      },
    },
  } as unknown as AuthClient;

  await invokeFunction("dashboard-student", undefined, studentClient);
  assertEquals(calls, ["student"]);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails.**

Run: `deno test test/src/lib/api/client.test.ts --allow-env`

Expected: FAIL because `invokeFunction` does not yet accept an injected client.

- [ ] **Step 3: Implement the two-client setup.**

Centralize environment values in `src/lib/supabase/client.ts`, then construct the student client with tab-scoped storage:

```ts
export const studentSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    storageKey: "mathventure-student-auth",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Keep the primary client’s existing storage behavior unchanged. Update `invokeFunction` to call `client.functions.invoke` and preserve the existing error-message extraction. Add the explicit teacher wrapper.

- [ ] **Step 4: Run the focused test and existing auth tests.**

Run: `deno test test/src/lib/auth/student-auth.test.ts test/src/lib/auth/useAuth.test.ts --allow-env`

Expected: PASS.

- [ ] **Step 5: Commit the independently testable client/API change.**

```bash
git add src/lib/supabase/client.ts src/lib/supabase/student-client.ts src/lib/api/client.ts test/src/lib/api/client.test.ts
git commit -m "feat: add isolated student auth client"
```

## Task 2: Add teacher-authorized student session issuance and disable public student login

**Files:**

- Create: `supabase/functions/student-view-as/handler.ts`
- Create: `supabase/functions/student-view-as/index.ts`
- Create: `test/supabase/functions/student-view-as/handler.test.ts`
- Modify: `supabase/functions/student-login/handler.ts`
- Modify: `test/supabase/functions/student-login/handler.test.ts`

**Interfaces:**

```ts
type StudentViewAsDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  isStudentInTeacherClass(input: { teacherId: string; studentId: string }): Promise<boolean>;
  getStudentEmail(studentId: string): Promise<string | null>;
  issueStudentSession(email: string): Promise<StudentSessionPayload>;
};

export function createStudentViewAsHandler(
  deps: StudentViewAsDeps = defaultDeps,
): (req: Request) => Promise<Response>;
```

- [ ] **Step 1: Write failing handler tests.**

Cover OPTIONS, method rejection, unauthenticated rejection, non-teacher rejection, non-member rejection, missing student ID rejection, successful session issuance, and dependency failure. The success test must prove the function passes the exact requested student ID to membership verification and email lookup.

```ts
Deno.test("student-view-as issues a session only for a teacher's roster student", async () => {
  const calls: string[] = [];
  const handler = createStudentViewAsHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    isStudentInTeacherClass: async ({ teacherId, studentId }) => {
      calls.push(`${teacherId}:${studentId}`);
      return true;
    },
    getStudentEmail: async () => "student-1@auth.mathventure.invalid",
    issueStudentSession: async (email) => ({
      status: "ok",
      email,
      tokenHash: "token-hash",
      verifyType: "email",
    }),
  });

  const response = await handler(new Request("http://local/student-view-as", {
    method: "POST",
    body: JSON.stringify({ studentId: "student-1" }),
  }));

  assertEquals(response.status, 200);
  assertEquals(calls, ["teacher-1:student-1"]);
});
```

- [ ] **Step 2: Run the new handler test and confirm it fails.**

Run: `deno test test/supabase/functions/student-view-as/handler.test.ts`

Expected: FAIL because the handler and function do not exist.

- [ ] **Step 3: Implement server-side authorization.**

The default membership dependency must query `class_students` joined to `classes` and require `classes.teacher_id = teacherId` and `class_students.student_id = studentId`. The email dependency must use `adminClient.auth.admin.getUserById` and return null when no email exists. The handler must require a JSON `studentId`, load the profile, require `role === "teacher"`, verify membership, issue a magic-link payload for that exact student, and return the payload through `jsonResponse`.

Use the existing CORS/error conventions and return:

- `401` for missing auth or missing profile.
- `403` for non-teachers or students outside the teacher’s classroom.
- `422` for missing/invalid student ID.
- `404` when the student auth user has no email.
- `500` with a stable error message when a dependency fails.

- [ ] **Step 4: Disable the old public student-login handler.**

Replace its lookup/session path with the same compatibility behavior as `student-register`: respond to POST with status `410` and `{ error: "Student login is available only through a teacher account." }`, while retaining CORS and OPTIONS handling. Update the old tests so they assert that names never reach a session issuer.

- [ ] **Step 5: Run targeted backend tests.**

Run: `deno test test/supabase/functions/student-view-as/handler.test.ts test/supabase/functions/student-login/handler.test.ts test/supabase/functions/_shared/hidden_student_provision.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the backend authorization change.**

```bash
git add supabase/functions/student-view-as supabase/functions/student-login/handler.ts test/supabase/functions/student-view-as/handler.test.ts test/supabase/functions/student-login/handler.test.ts
git commit -m "feat: authorize teacher student account viewing"
```

## Task 3: Add reversible auth-provider transitions

**Files:**

- Modify: `src/lib/auth/auth.ts`
- Modify: `src/lib/auth/useAuth.tsx`
- Modify: `src/lib/auth/index.ts`
- Modify: `src/lib/auth/student-auth.ts`
- Modify: `test/src/lib/auth/useAuth.test.ts`
- Modify: `test/src/lib/auth/student-auth.test.ts`

**Interfaces:**

```ts
type AuthContextType = {
  user: UserProfile | null;
  teacherUser: UserProfile | null;
  viewingStudent: UserProfile | null;
  isViewingStudent: boolean;
  isLoading: boolean;
  viewStudentAccount(studentId: string): Promise<void>;
  returnToTeacherAccount(): Promise<void>;
  refreshProfile(): Promise<void>;
};
```

- [ ] **Step 1: Write failing pure transition tests.**

Test that an initial teacher session produces `user === teacherUser`, entering student view changes only the active user and preserves the teacher profile, returning restores the teacher profile, and a failed student session leaves the teacher active.

- [ ] **Step 2: Run the focused auth tests and confirm the new assertions fail.**

Run: `deno test test/src/lib/auth/useAuth.test.ts test/src/lib/auth/student-auth.test.ts`

Expected: FAIL on the new transition assertions.

- [ ] **Step 3: Implement auth operations.**

In `auth.ts`, add `viewStudentAccount(studentId)` that calls `invokeTeacherFunction("student-view-as", { method: "POST", body: { studentId } })`, validates the returned `StudentSessionPayload`, and calls `studentSupabase.auth.verifyOtp(buildVerifyOtpParams(payload))`. Add `returnToTeacherAccount()` that calls `studentSupabase.auth.signOut()` only. Keep teacher sign-in, signup, and sign-out on the primary client.

In `useAuth.tsx`:

- Subscribe to the primary client’s auth events for teacher state.
- Read the secondary client session on startup and derive `viewingStudent` from its metadata/profile.
- On view-as success, set the active user from the secondary session and mark student view active.
- On return, clear student state and restore the teacher profile.
- On global sign-out, sign out both clients.
- Expose the new context methods and preserve `refreshProfile`.

Use `queryClient.clear()` or an equivalent complete cache clear at each successful mode transition so all role-sensitive queries refetch under the correct client.

- [ ] **Step 4: Run the focused auth tests.**

Run: `deno test test/src/lib/auth/useAuth.test.ts test/src/lib/auth/student-auth.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the auth transition change.**

```bash
git add src/lib/auth src/lib/supabase/student-client.ts test/src/lib/auth
git commit -m "feat: support reversible student account view"
```

## Task 4: Update login, roster, navigation, and student-view UI

**Files:**

- Modify: `src/pages/auth.tsx`
- Modify: `src/components/teacher/TeacherStudentListTable.tsx`
- Modify: `src/pages/teacher.tsx`
- Modify: `src/components/layout.tsx`
- Modify: `src/App.tsx` if route redirects are needed after transition
- Add focused component/page tests in the existing `test/src` structure where supported

**Interfaces:**

```ts
type TeacherStudentListTableProps = {
  students: TeacherClassStudent[];
  onRemove(student: TeacherClassStudent): void;
  onView(student: TeacherClassStudent): void;
  viewingStudentId?: string | null;
};
```

- [ ] **Step 1: Write failing UI/helper tests.**

Cover that the login page has no student role selector/name fields, each roster student exposes `View Account`, and the student-view banner renders the selected name and return action.

- [ ] **Step 2: Run the focused UI tests and confirm they fail.**

Run: `deno test test/src/pages/auth.test.ts test/src/components/teacher-student-list-table.test.ts`

Expected: FAIL where the new files or assertions are not present. If a renderer is unavailable in the existing Deno setup, extract and test pure view-model helpers instead of introducing a new test framework.

- [ ] **Step 3: Make login teacher-only.**

Remove `Role` state, the role selector, student fields, and `studentSignIn` import from `src/pages/auth.tsx`. Render only email/password inputs on `/login`, keep teacher sign-in submission, and retain the teacher-only signup link/copy.

- [ ] **Step 4: Add the roster transition action.**

Add an `onView` callback and a `View Account` button to each row. In `TeacherWorkspacePage`, call `viewStudentAccount(student.id)`, show loading/error feedback, and navigate to `/student` after success. Keep Remove behavior unchanged.

- [ ] **Step 5: Add the persistent mode banner and return action.**

In `TopNav`, when `isViewingStudent` is true, show the selected student name and a `Return to teacher account` button. Its handler must call `returnToTeacherAccount()` and navigate to `/teacher`. While active, derive nav items from the student role and do not render teacher controls. Ensure global sign-out clears both sessions.

- [ ] **Step 6: Run targeted UI/type checks.**

Run: `npm run typecheck`

Expected: PASS with no unused imports or incompatible context props.

- [ ] **Step 7: Commit the UI change.**

```bash
git add src/pages/auth.tsx src/components/teacher/TeacherStudentListTable.tsx src/pages/teacher.tsx src/components/layout.tsx src/App.tsx test/src
git commit -m "feat: add teacher student account view controls"
```

## Task 5: Verify end-to-end behavior and repository quality gates

**Files:**

- Modify only files required by failures found in Tasks 1–4; do not alter unrelated user changes.

- [ ] **Step 1: Run the focused backend and auth checks together.**

Run: `deno test test/supabase/functions/student-view-as/handler.test.ts test/supabase/functions/student-login/handler.test.ts test/src/lib/auth/student-auth.test.ts test/src/lib/auth/useAuth.test.ts`

Expected: PASS.

- [ ] **Step 2: Run the complete test suite.**

Run: `npm test`

Expected: all existing and new Deno tests pass, with no focused or skipped suites.

- [ ] **Step 3: Run the typecheck and production build.**

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npm run build`

Expected: Vite production build completes successfully.

- [ ] **Step 4: Inspect the final diff and status.**

Run: `git diff HEAD~4 --stat; git diff --check; git status --short`

Expected: only feature commits and the approved design/plan files are relevant; pre-existing `.tmp-shape-matching-build/` and `docs/superpowers/plans/2026-09-09-subtraction-raw-score.md` remain untouched.

- [ ] **Step 5: Commit any final verification fixes as one coherent change.**

```bash
git add src supabase test
git commit -m "fix: complete teacher student account view flow"
```

## Spec coverage self-review

- Teacher-only login: Task 4.
- Teacher-created student prerequisite: existing Add Students flow retained; Task 4 adds the roster action.
- Separate teacher and student sessions: Tasks 1 and 3.
- Server membership authorization: Task 2.
- Normal student dashboard and quiz access: Tasks 1, 3, and 4.
- Reversible return to teacher: Task 3 and Task 4.
- Public name-based login disabled: Task 2 and Task 4.
- Failure handling and session expiry: Tasks 2 and 3.
- Cache/data isolation: Tasks 1, 3, and 5.
- Regression and CI-equivalent checks: Task 5.

## Plan self-review

- No migrations are required because student accounts and classroom membership already exist.
- The plan defines the client, handler, auth, UI, and verification interfaces before dependent tasks use them.
- Existing untracked files are explicitly preserved.
- No task relies on an undefined placeholder or an unspecified implementation decision.
