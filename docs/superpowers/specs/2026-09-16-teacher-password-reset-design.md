# Teacher Password Reset and Change Design

## Scope

Add password-management flows for teacher accounts only. Teacher signup keeps
the existing behavior: Supabase creates the account, the client signs in
immediately, and no signup or first-login PIN is required. Student account
provisioning and student authentication are unchanged.

The feature has two password paths:

1. A signed-in teacher changes a password with the current password, a new
   password, and a confirmation.
2. A teacher who forgot a password requests a Supabase Auth recovery OTP by
   email, verifies the six-digit OTP, and sets a new password.

## Architecture

Supabase Auth remains the only password and session authority. The frontend
uses the existing teacher Supabase client directly for Auth operations. No
custom Edge Function, PIN table, SMTP library, or service-role operation is
needed.

Gmail SMTP is configured as Supabase Auth's custom SMTP provider outside the
client bundle. Auth email templates are configured to render the generated
OTP with `{{ .Token }}`. The hosted project must have email OTP expiry set to
300 seconds (5 minutes). Local configuration and operator setup are documented
without committing credentials.

## User flows

### Signup and login

`teacherSignUp` remains responsible for `supabase.auth.signUp` with teacher
metadata. The signup page continues to call `teacherSignIn` after signup and
redirects to the app. There is no verification screen in this flow.

### Forgot password

The login page exposes a forgot-password action. The teacher enters an email
address and the client calls `supabase.auth.resetPasswordForEmail` with the
configured recovery route. The UI then asks for the six-digit code and a new
password plus confirmation.

The client verifies the code with `supabase.auth.verifyOtp({ email, token,
type: 'recovery' })`. A successful verification establishes the recovery
session; the client then calls `supabase.auth.updateUser({ password })` and
redirects to login or the teacher workspace according to the resulting
session state. The request-success message remains generic so the UI does not
disclose whether an email belongs to an account.

Resending a recovery code uses Supabase Auth's recovery resend operation and
is subject to Auth's rate limits. Codes are not stored or inspected by the
application.

### Change password while signed in

Teacher Settings gains a change-password form with current password, new
password, and confirmation fields. The client submits all three values through
Supabase Auth's `updateUser({ password, current_password })` API. The locked
dependency version (`@supabase/supabase-js` 2.110.5) supports this option. The
new password is never logged or persisted by the application.

## Validation and errors

- Email fields use browser email validation and are normalized only for the
  request; passwords are never trimmed or transformed.
- New password and confirmation must match before an Auth request is made.
- OTP input accepts exactly six digits.
- Expired, invalid, or already-used codes surface a concise recoverable error.
- Reset request success is always phrased as if an email may have been sent.
- Auth errors are shown without exposing secrets or raw request payloads.
- Loading and submit states prevent duplicate requests.

## Configuration

Document the following operator actions:

- configure Gmail SMTP in Supabase Auth settings using a Gmail app password,
  not a regular account password;
- enable external email delivery and set the sender identity;
- set the Auth email OTP expiration to 300 seconds;
- customize the reset-password template to include `{{ .Token }}`;
- add the recovery route to the Supabase redirect allow list;
- keep SMTP credentials out of Git, frontend environment variables, and logs.

The repository documents the hosted Supabase Auth settings as the source of
truth. Hosted SMTP credentials and the 300-second OTP expiry remain
dashboard-managed settings; no credential is committed to the repository.

## Testing and CI gate

Add unit tests for the Auth-layer request/response behavior and page-level
source or interaction tests consistent with the existing Deno test setup.
Coverage must include:

- signup still signs in without a verification step;
- reset request validates email and uses a generic success state;
- recovery OTP requires six digits and calls the recovery verification type;
- matching new-password confirmation is required;
- signed-in change-password submits current and new credentials;
- Auth failures return the UI to an actionable state without leaking values.

Before completion, run the repository's complete relevant checks: typecheck,
all tests, and production build. No test may be skipped, focused, or weakened.
