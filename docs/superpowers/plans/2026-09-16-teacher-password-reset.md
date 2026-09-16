# Teacher Password Reset and Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add teacher-only password reset by Supabase-generated six-digit email OTP and signed-in password change with current-password verification, delivered through Gmail SMTP.

**Architecture:** Keep Supabase Auth as the password/session authority and add a small injectable client wrapper in src/lib/auth/password.ts for validation, reset requests, recovery OTP verification, and signed-in password updates. Add public forgot-password and reset-password screens plus a settings form, while configuring OTP expiry and email templates through Supabase configuration and documented hosted settings.

**Tech Stack:** React 19, TypeScript, Wouter, Supabase JS 2.110.5, Tailwind CSS, Deno tests, Vite, Supabase CLI.

## Global Constraints

- Teacher signup remains immediate: call teacherSignUp, then teacherSignIn; do not add a signup or first-login PIN.
- Student account provisioning and student authentication remain unchanged.
- Supabase Auth generates and validates the six-digit recovery OTP; the application never stores or logs it.
- Recovery OTP expiry is exactly 300 seconds (5 minutes).
- Gmail SMTP credentials are hosted Supabase secrets and must never enter frontend environment variables, source control, or logs.
- Reset-request success must not reveal whether an email belongs to an account.
- Passwords are never trimmed, transformed, logged, or persisted by application code.
- Use updateUser({ password, current_password }) for signed-in changes; the locked @supabase/supabase-js 2.110.5 dependency supports this API.
- Do not use focused, skipped, weakened, or swallowed tests.
- After each code/configuration edit, run the smallest complete affected check; before completion run typecheck, all tests, and production build.

---

## File Map

- Create: src/lib/auth/password.ts — injectable teacher password Auth operations, route construction, and input validation.
- Modify: src/lib/auth/index.ts — export password operations for page consumers.
- Modify: src/pages/auth.tsx — add forgot-password request and OTP/new-password screens without changing signup behavior.
- Modify: src/App.tsx — route /forgot-password and /reset-password.
- Modify: src/pages/teacher.tsx — add the signed-in Teacher Settings password form.
- Modify: src/lib/i18n/useLanguage.tsx — add English and Tagalog labels/messages.
- Modify: supabase/config.toml — local Auth settings for immediate signup, six-digit OTPs, 300-second expiry, secure password changes, and the local recovery template.
- Create: supabase/templates/recovery.html — local Supabase Auth recovery email containing {{ .Token }}.
- Modify: README.md — hosted Gmail SMTP, Auth dashboard, redirect URL, and email-template setup instructions.
- Create: test/src/lib/auth/password.test.ts — unit tests for validation and Auth calls using a fake Auth client.
- Modify: test/src/pages/auth.test.ts — page-level regression checks for signup and reset UI contracts.
- Create: test/src/pages/teacher-settings-password.test.ts — source-level checks for the settings form and current-password submission.

## Interfaces Shared Between Tasks

src/lib/auth/password.ts exposes these exact interfaces:

    export type PasswordAuthApi = {
      resetPasswordForEmail: (
        email: string,
        options?: { redirectTo?: string },
      ) => Promise<{ error: Error | null }>;
      verifyOtp: (credentials: {
        email: string;
        token: string;
        type: 'recovery';
      }) => Promise<{ error: Error | null }>;
      updateUser: (attributes: {
        password: string;
        current_password?: string;
      }) => Promise<{ error: Error | null }>;
    };

    export const PASSWORD_RESET_ROUTE = '/reset-password';
    export const PASSWORD_RESET_OTP_LENGTH = 6;
    export function normalizeAuthEmail(email: string): string;
    export function validateRecoveryOtp(token: string): string | null;
    export function validateNewPassword(password: string, confirmation: string): string | null;
    export function getPasswordResetRedirectUrl(origin?: string): string;
    export async function requestTeacherPasswordReset(
      email: string,
      auth?: PasswordAuthApi,
    ): Promise<void>;
    export async function verifyTeacherPasswordResetOtp(
      email: string,
      token: string,
      auth?: PasswordAuthApi,
    ): Promise<void>;
    export async function changeTeacherPassword(
      currentPassword: string,
      newPassword: string,
      confirmation: string,
      auth?: PasswordAuthApi,
    ): Promise<void>;

The default auth argument is supabase.auth. Tests pass a fake object with the same
methods so request payloads and failure behavior are directly assertable without
network access.

### Task 1: Add the password Auth wrapper and tests

**Files:**
- Create: src/lib/auth/password.ts
- Modify: src/lib/auth/index.ts
- Create: test/src/lib/auth/password.test.ts

**Interfaces:**
- Consumes: supabase.auth from src/lib/supabase/client.ts.
- Produces: the exported functions and PasswordAuthApi listed above.

- [ ] **Step 1: Write the failing unit tests**

Create a fake Auth client and assert exact validation and payload behavior:

    import { assertEquals, assertRejects } from "jsr:@std/assert";
    import {
      changeTeacherPassword,
      getPasswordResetRedirectUrl,
      normalizeAuthEmail,
      requestTeacherPasswordReset,
      validateNewPassword,
      validateRecoveryOtp,
      verifyTeacherPasswordResetOtp,
      type PasswordAuthApi,
    } from "../../../../src/lib/auth/password.ts";

    const makeAuth = (calls: Array<unknown>): PasswordAuthApi => ({
      resetPasswordForEmail: async (email, options) => {
        calls.push(['reset', email, options]);
        return { error: null };
      },
      verifyOtp: async (credentials) => {
        calls.push(['verify', credentials]);
        return { error: null };
      },
      updateUser: async (attributes) => {
        calls.push(['update', attributes]);
        return { error: null };
      },
    });

    Deno.test('normalizes email for Auth requests', () => {
      assertEquals(normalizeAuthEmail('  Teacher@Example.COM '), 'teacher@example.com');
    });

    Deno.test('validates a six-digit recovery OTP', () => {
      assertEquals(validateRecoveryOtp('123456'), null);
      assertEquals(validateRecoveryOtp('12345'), 'Enter the 6-digit code.');
      assertEquals(validateRecoveryOtp('12a456'), 'Enter the 6-digit code.');
    });

    Deno.test('requires a matching non-empty new password', () => {
      assertEquals(validateNewPassword('new-secret', 'new-secret'), null);
      assertEquals(validateNewPassword('', ''), 'Enter a new password.');
      assertEquals(validateNewPassword('new-secret', 'different'), 'Passwords do not match.');
    });

    Deno.test('requests recovery with a normalized email and reset route', async () => {
      const calls: Array<unknown> = [];
      await requestTeacherPasswordReset('  TEACHER@example.com ', makeAuth(calls));
      assertEquals(calls, [[
        'reset',
        'teacher@example.com',
        { redirectTo: 'https://app.example/reset-password' },
      ]]);
      assertEquals(
        getPasswordResetRedirectUrl('https://app.example/'),
        'https://app.example/reset-password',
      );
    });

    Deno.test('verifies a recovery OTP with the recovery type', async () => {
      const calls: Array<unknown> = [];
      await verifyTeacherPasswordResetOtp('Teacher@Example.com', '123456', makeAuth(calls));
      assertEquals(calls, [['verify', {
        email: 'teacher@example.com',
        token: '123456',
        type: 'recovery',
      }]]);
    });

    Deno.test('submits current and new passwords for a signed-in change', async () => {
      const calls: Array<unknown> = [];
      await changeTeacherPassword('current-secret', 'new-secret', 'new-secret', makeAuth(calls));
      assertEquals(calls, [['update', {
        password: 'new-secret',
        current_password: 'current-secret',
      }]]);
    });

    Deno.test('does not call Auth for an invalid OTP', async () => {
      const calls: Array<unknown> = [];
      await assertRejects(
        () => verifyTeacherPasswordResetOtp('teacher@example.com', 'bad', makeAuth(calls)),
        Error,
        'Enter the 6-digit code.',
      );
      assertEquals(calls, []);
    });

Run: deno test --allow-read --allow-env --import-map=deno.json test/src/lib/auth/password.test.ts

Expected: FAIL because the module and functions do not exist yet.

- [ ] **Step 2: Implement the minimal password wrapper**

Implement the exported interfaces above. Use supabase.auth as the default client. Normalize email with trim and lowercase, require a non-empty address containing @, require exactly six decimal digits for recovery OTPs, and require non-empty matching new-password fields. Construct the absolute redirect URL from window.location.origin plus /reset-password. Call resetPasswordForEmail with that redirect, verifyOtp with type recovery, and updateUser with password plus current_password. Throw returned Auth errors without logging any input.

Export the module from src/lib/auth/index.ts with:

    export * from './password';

- [ ] **Step 3: Run focused tests**

Run: deno test --allow-read --allow-env --import-map=deno.json test/src/lib/auth/password.test.ts

Expected: all password wrapper tests pass.

- [ ] **Step 4: Run typecheck**

Run: npm run typecheck

Expected: TypeScript exits with status 0.

- [ ] **Step 5: Commit**

    git add src/lib/auth/password.ts src/lib/auth/index.ts test/src/lib/auth/password.test.ts
    git commit -m "feat: add teacher password auth operations"

### Task 2: Add forgot-password and OTP reset pages

**Files:**
- Modify: src/pages/auth.tsx
- Modify: src/App.tsx
- Modify: src/lib/i18n/useLanguage.tsx
- Modify: test/src/pages/auth.test.ts

**Interfaces:**
- Consumes: requestTeacherPasswordReset, verifyTeacherPasswordResetOtp,
  validateNewPassword, PASSWORD_RESET_OTP_LENGTH, and supabase.auth.
- Produces: public /forgot-password and /reset-password routes. Signup remains
  the current teacherSignUp then teacherSignIn sequence.

- [ ] **Step 1: Write failing page regression tests**

Append these tests to test/src/pages/auth.test.ts:

    Deno.test('signup keeps the immediate sign-in flow', () => {
      assertEquals(source.includes('await teacherSignUp(email, password, fullName);'), true);
      assertEquals(source.includes('await teacherSignIn(email, password);'), true);
      assertEquals(source.includes('verifyTeacherPasswordResetOtp'), false);
    });

    Deno.test('auth pages expose recovery request and six-digit reset controls', () => {
      assertEquals(source.includes('export function ForgotPassword()'), true);
      assertEquals(source.includes('export function PasswordReset()'), true);
      assertEquals(source.includes('requestTeacherPasswordReset'), true);
      assertEquals(source.includes('verifyTeacherPasswordResetOtp'), true);
      assertEquals(source.includes('inputMode="numeric"'), true);
      assertEquals(source.includes('maxLength={PASSWORD_RESET_OTP_LENGTH}'), true);
    });

Run: deno test --allow-read --allow-env --import-map=deno.json test/src/pages/auth.test.ts

Expected: FAIL until the components are implemented.

- [ ] **Step 2: Implement ForgotPassword**

Add a ForgotPassword component using the existing Card, Input, Label, and
Button components. Keep email, error, message, and loading state. On submit,
call requestTeacherPasswordReset(email) once, then show the generic message
"If an account uses that email, a reset code is on its way." Link to
/reset-password with the encoded email after success, and provide links to
/login and /. Disable submit while loading.

Add a "Forgot password?" link to Login pointing to /forgot-password. Keep the
existing signup handler unchanged and do not import reset functions into Signup.

- [ ] **Step 3: Implement PasswordReset**

Add a PasswordReset component that reads an optional email query parameter and
collects email, token, new password, and confirmation. On submit, validate the
password pair, then call:

    await verifyTeacherPasswordResetOtp(email, token);
    await supabase.auth.updateUser({ password: newPassword });
    await supabase.auth.signOut();
    setLocation('/login?reset=success');

Use inputMode="numeric", pattern="[0-9]{6}", and
maxLength={PASSWORD_RESET_OTP_LENGTH}. Add a resend button that calls
requestTeacherPasswordReset(email) again; do not call supabase.auth.resend for
recovery. Preserve email after invalid or expired OTP errors, clear old status
before each submit, disable duplicate submissions, and show actionable error
text.

- [ ] **Step 4: Register routes**

In src/App.tsx import ForgotPassword and PasswordReset and add:

    <Route path="/forgot-password" component={ForgotPassword} />
    <Route path="/reset-password" component={PasswordReset} />

- [ ] **Step 5: Add translations and run checks**

Add English and Tagalog entries for the two page titles, code label, reset
messages, resend text, password confirmation, and errors in
src/lib/i18n/useLanguage.tsx. Use the translation keys in new UI without
changing translation behavior.

Run:

    deno test --allow-read --allow-env --import-map=deno.json test/src/pages/auth.test.ts
    npm run typecheck

Expected: both commands pass.

- [ ] **Step 6: Commit**

    git add src/pages/auth.tsx src/App.tsx src/lib/i18n/useLanguage.tsx test/src/pages/auth.test.ts
    git commit -m "feat: add teacher password recovery screens"

### Task 3: Add signed-in change-password form to Teacher Settings

**Files:**
- Modify: src/pages/teacher.tsx
- Create: test/src/pages/teacher-settings-password.test.ts

**Interfaces:**
- Consumes: changeTeacherPassword from @/lib/auth.
- Produces: a settings form submitting current password, new password, and
  confirmation without persistence.

- [ ] **Step 1: Write failing source-level tests**

    import { assertEquals } from "jsr:@std/assert";

    const source = await Deno.readTextFile(
      new URL("../../../src/pages/teacher.tsx", import.meta.url),
    );

    Deno.test('teacher settings exposes all password fields', () => {
      assertEquals(source.includes('current-password'), true);
      assertEquals(source.includes('new-password'), true);
      assertEquals(source.includes('confirm-password'), true);
      assertEquals(source.includes('changeTeacherPassword'), true);
    });

    Deno.test('settings does not persist or log password values', () => {
      assertEquals(source.includes('localStorage.setItem'), false);
      assertEquals(source.includes('console.log(currentPassword'), false);
      assertEquals(source.includes('console.log(newPassword'), false);
    });

Run: deno test --allow-read --allow-env --import-map=deno.json test/src/pages/teacher-settings-password.test.ts

Expected: FAIL until the form is added.

- [ ] **Step 2: Implement the settings form**

Import Input, Label, and changeTeacherPassword. Add state for
currentPassword, newPassword, confirmPassword, passwordError,
passwordMessage, and isChangingPassword. Add a section below account details
with inputs using exactly these IDs:

    current-password
    new-password
    confirm-password

On submit, clear prior state, set loading, and call:

    await changeTeacherPassword(currentPassword, newPassword, confirmPassword);
    setPasswordMessage('Your password has been changed.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

Catch Error messages into visible error state, disable the button while
submitting, and clear loading in finally. Preserve existing sign-out and
student-view behavior.

- [ ] **Step 3: Run focused tests and typecheck**

Run:

    deno test --allow-read --allow-env --import-map=deno.json test/src/pages/teacher-settings-password.test.ts
    npm run typecheck

Expected: both commands pass.

- [ ] **Step 4: Commit**

    git add src/pages/teacher.tsx test/src/pages/teacher-settings-password.test.ts
    git commit -m "feat: add teacher change password form"

### Task 4: Configure Supabase OTP behavior and document Gmail SMTP

**Files:**
- Modify: supabase/config.toml
- Create: supabase/templates/recovery.html
- Modify: README.md

**Interfaces:**
- Consumes: Supabase Auth local configuration and hosted dashboard settings.
- Produces: six-digit, 300-second recovery codes and operator instructions
  for Gmail SMTP without checked-in secrets.

- [ ] **Step 1: Add local Auth settings and recovery template**

Append to supabase/config.toml:

    [auth.email]
    enable_confirmations = false
    otp_length = 6
    otp_expiry = 300
    secure_password_change = true

    [auth.email.template.recovery]
    subject = "Your MathVenture password reset code"
    content_path = "./supabase/templates/recovery.html"

Create supabase/templates/recovery.html:

    <h2>Reset your MathVenture password</h2>
    <p>Enter this 6-digit code in MathVenture to choose a new password:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">{{ .Token }}</p>
    <p>This code expires in 5 minutes. If you did not request a reset, you can ignore this email.</p>

Do not add SMTP usernames, passwords, app passwords, or project tokens.

- [ ] **Step 2: Document hosted Gmail SMTP setup**

Add a README section instructing an operator to:

1. Create a Gmail app password for the sending account; never use the normal
   Gmail password.
2. In Supabase Authentication settings, enable external email delivery and
   configure smtp.gmail.com on port 465 SSL or 587 STARTTLS, the Gmail sender
   address, app password, and sender name.
3. Keep email confirmations disabled because teacher signup is intentionally
   immediate.
4. Set Email OTP expiration to 300 seconds and OTP length to 6.
5. Set the hosted Reset Password template to include {{ .Token }} and keep
   /reset-password in the allowed redirect URLs.
6. Add the deployed application URL and its reset route to the Supabase
   redirect allow list.
7. Disable Gmail link tracking if enabled and keep SMTP credentials only in
   Supabase-managed settings.

Document local testing through Supabase Mailpit and state that Gmail
credentials are not needed locally.

- [ ] **Step 3: Validate configuration and docs**

Run:

    npm run supabase:start
    npm run supabase:stop
    rg -n "otp_expiry = 300|otp_length = 6|\\.Token|smtp.gmail.com|app password" supabase/config.toml supabase/templates/recovery.html README.md

Expected: the local Supabase stack accepts the configuration and stops cleanly;
the search shows required settings, and no secret values are present. If Docker
or the Supabase CLI is unavailable, record local configuration validation as
blocked and continue with the repository's available checks.

- [ ] **Step 4: Commit**

    git add supabase/config.toml supabase/templates/recovery.html README.md
    git commit -m "docs: configure teacher recovery email delivery"

### Task 5: Run the complete CI-equivalent verification

**Files:**
- No new files; inspect the complete diff and test output.

**Interfaces:**
- Consumes: all implementation, configuration, and tests from Tasks 1–4.
- Produces: fresh local evidence for typecheck, tests, and production build.

- [ ] **Step 1: Run the full test suite**

Run: npm test

Expected: all existing and new Deno tests pass with no focused or skipped
tests.

- [ ] **Step 2: Run production typecheck**

Run: npm run typecheck

Expected: TypeScript exits with status 0.

- [ ] **Step 3: Run production build**

Run: npm run build

Expected: Vite exits with status 0 and emits the production bundle.

- [ ] **Step 4: Inspect final diff and status**

Run:

    git diff origin/master..HEAD --stat
    git status --short --branch
    rg -n "console\\.(log|debug).*password|VITE_.*SMTP|smtp_pass|app.?password" src supabase README.md

Expected: only task files are in task commits; pre-existing unrelated worktree
files remain untouched; the secret scan returns no matches.

- [ ] **Step 5: Report verification exactly**

Report commit IDs, test/typecheck/build commands, and fresh results. State
separately that hosted Gmail SMTP configuration is operator-managed and cannot
be verified from the local build unless project credentials and dashboard
access are available.
