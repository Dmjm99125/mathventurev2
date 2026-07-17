# Student LRN Auth Design

## Summary

Replace student email/password auth with an LRN-based flow while keeping teacher auth on the existing Supabase email/password path. Students will continue to use the shared `/login` and `/signup` screens, but their student-mode fields and backend flow will change to use `LRN`, `Last Name`, and `Class Code` instead of visible credentials.

The implementation will still end in a normal Supabase session for both teachers and students. That preserves the existing `useAuth` flow, route behavior, and edge-function authorization model.

## Goals

- Keep teacher signup and login on the existing email/password Supabase flow.
- Keep a single shared login page and a single shared signup page.
- Let students sign up with `LRN`, `Class Code`, and `Last Name`.
- Let students sign in with `LRN` and `Last Name`.
- Hide OTPs, passwords, and email-based auth steps from children.
- Reuse the current Supabase session model so the rest of the app remains authenticated the same way.
- Apply any database change through a new migration file only. Existing applied migrations are treated as immutable.

## Non-Goals

- High-assurance student authentication.
- Password reset, email verification, or OTP entry for students.
- Reworking teacher auth.
- Rewriting the app away from Supabase Auth.
- Supporting direct browser access to Supabase admin auth APIs.

## Product Constraints

- This is intentionally low-assurance auth for a short-lived deployment window.
- The app may trust knowledge of `LRN + Last Name` for student login.
- Child-facing copy must stay simple and must not mention OTPs, tokens, synthetic emails, or hidden accounts.
- Backend changes must follow the repo rule that prior Supabase schema is assumed applied already; schema evolution happens in new migration files only.

## User Experience

## Shared Login Page

The `/login` page remains a single page for both roles. It gains the same student/teacher role toggle that already exists on `/signup`.

- `Teacher` mode keeps the current `Email` and `Password` inputs.
- `Student` mode uses `LRN` and `Last Name`.
- The child never sees an OTP, email address, password, or "check your inbox" instruction.

Recommended default mode for `/login` is `student`, since the primary classroom user is a child.

## Shared Signup Page

The `/signup` page remains a single page for both roles.

- `Teacher` mode keeps the current `Full Name`, `Email`, and `Password` flow.
- `Student` mode changes to:
  - `LRN`
  - `Class Code`
  - `Last Name`
- Student signup both registers the student and signs them in immediately.

## Student Error States

Student-facing errors should stay short, child-safe, and non-technical:

- Invalid class code: "We couldn't find that class code."
- Missing or invalid LRN: "Check your learner number and try again."
- Student already registered during signup: "You already have an account. Try logging in."
- Student login mismatch: "We couldn't sign you in with that information."
- Unexpected backend/auth failure: "We couldn't sign you in right now."

Detailed causes should be logged server-side, not surfaced to children.

## Chosen Architecture

## Teacher Auth

Teacher auth stays exactly where it is today:

- `supabase.auth.signUp()` for teacher registration
- `supabase.auth.signInWithPassword()` for teacher login
- existing `profiles` trigger and `useAuth` flow remain intact

No teacher-facing auth behavior should change beyond sharing the updated page shell with the role toggle.

## Student Auth

Student auth remains Supabase-based, but not through child-managed credentials.

Each student gets a hidden Supabase auth user that the backend manages. The student never sees:

- the auth email
- the auth password
- the one-time credential used to complete sign-in

After the backend validates student identity from `LRN` and `Last Name`, it bootstraps a normal Supabase session for that student account. The browser then behaves like any other signed-in Supabase client session.

## Session Bootstrapping

Student sign-in and signup should use Supabase admin auth APIs inside an Edge Function to produce a short-lived one-time auth credential for the matched student account. The client should then complete the sign-in programmatically with `supabase.auth.verifyOtp(...)` and persist the resulting session normally.

The child does not enter the OTP. The application consumes the server-provided credential automatically.

This design uses Supabase as the actual auth system while keeping the child-facing experience limited to `LRN`, `Last Name`, and `Class Code`.

## Data Model

## Existing Tables

The current schema already has:

- `profiles`
- `classes`
- `class_students`

Those tables remain the core of the model.

## New Migration

All schema changes for this feature must go in a brand-new migration file. Do not edit `supabase/migrations/0001_init.sql`.

## Profile Fields

Add the following columns to `public.profiles` in a new migration:

- `lrn text`
- `normalized_lrn text`
- `last_name text`
- `normalized_last_name text`

These fields are required for student auth lookups. Teacher records may leave them null if the teacher flow does not need them.

`full_name` remains for display and compatibility with existing UI and edge-function responses.

## LRN Constraints

Add a uniqueness guarantee for student LRNs:

- `normalized_lrn` must uniquely identify a single student profile.
- Teacher profiles should not participate in that uniqueness rule if the schema uses a partial unique index.

Recommended implementation shape:

- a partial unique index on `normalized_lrn` where `role = 'student'` and `normalized_lrn is not null`

This lets the system reject duplicate student registrations for the same LRN cleanly.

## Hidden Student Auth Identity

Student profiles continue to use the existing `profiles.id -> auth.users.id` relationship. No separate student identity table is required for this feature.

For hidden student auth accounts:

- create a synthetic unique email address
- set `role: "student"` in metadata
- store `full_name`, `last_name`, and `lrn` in auth metadata
- let the existing auth trigger continue to create the base `profiles` row
- update the student-specific profile columns after auth-user creation if the trigger does not populate them directly

The synthetic email only exists to satisfy Supabase Auth identity requirements. It is not shown in the UI.

## Normalization Rules

Normalization must be deterministic and shared between register/login flows:

- trim leading and trailing whitespace
- collapse repeated internal whitespace to a single space for names
- uppercase lookup values
- remove non-digit separators from LRNs if the input format may include spaces or dashes

Examples:

- `" 1234-5678-9012 "` -> `123456789012`
- `" dela Cruz "` -> `DELA CRUZ`

Display values should preserve the student-entered casing where possible, while lookup values use the normalized fields.

## Identity Rules

Student identity is keyed by normalized LRN.

- `Class Code` is required only during student signup to establish class enrollment.
- `Last Name` is stored and checked as a lightweight second factor at login.
- `LRN + Last Name` is sufficient for student login in this project.

If signup encounters an existing student with the same normalized LRN, the backend must not create a second account.

That case is handled explicitly:

- `student-register` returns an `already_registered` response instead of creating another student account.
- The frontend can direct that student to the login flow.

## Backend Changes

## New Edge Functions

Add two student-specific Edge Functions:

- `student-register`
- `student-login`

These functions will use the existing service-role-backed `adminClient` pattern from `supabase/functions/_shared/client.ts`.

## `student-register`

Request body:

- `lrn`
- `classCode`
- `lastName`

Behavior:

1. Normalize the LRN, class code, and last name.
2. Find the class by join code.
3. Look for an existing student profile with the same normalized LRN.
4. If a matching student exists, return `already_registered` and do not create another account.
5. If no matching student exists:
   - create a hidden student auth user through Supabase admin auth
   - ensure profile student fields are populated
   - insert the `class_students` row for the selected class
6. Generate the one-time auth credential for the target student account.
7. Return the data the client needs to complete `verifyOtp(...)` automatically.

The endpoint should be idempotent enough that a retried submission does not create duplicate student accounts for the same normalized LRN.

## `student-login`

Request body:

- `lrn`
- `lastName`

Behavior:

1. Normalize the LRN and last name.
2. Find the student by normalized LRN.
3. If no student matches, return a login failure.
4. Compare the submitted normalized last name to the stored normalized last name.
5. If the last name does not match, return a login failure.
6. If the last name matches, generate the one-time auth credential for that student account and return success.

## Auth Provisioning Details

Hidden student auth users should be created only on the server with Supabase admin auth APIs. The browser must never receive:

- the service role key
- a reusable student password
- direct auth admin access

The browser may receive only the short-lived one-time credential needed to finish sign-in for the selected student account.

## Frontend Changes

## Auth Page Behavior

`src/pages/auth.tsx` should be updated so that:

- `Login` has a role toggle like `Signup`
- `Login` conditionally renders teacher or student fields
- `Signup` conditionally renders teacher or student fields
- student mode uses `LRN`-based forms instead of email/password
- child-safe errors appear inline on the current card

The page shell, navigation, and current visual structure should remain shared.

## Auth Library

`src/lib/auth.ts` should stop treating all sign-in and sign-up flows as email/password operations.

It should expose role-aware helpers for:

- teacher signup
- teacher login
- student registration via edge function + automatic `verifyOtp(...)`
- student login via edge function + automatic `verifyOtp(...)`

`src/lib/useAuth.tsx` should need little or no structural change because a successful student flow still ends with a standard Supabase session.

## Copy and Translation Keys

`src/lib/useLanguage.tsx` will need new strings for:

- `LRN`
- `Class Code`
- `Last Name`
- student-mode login and signup helper text
- child-safe student auth errors

The copy should avoid technical auth language in student mode.

## Route and App Impact

Because the final student state is still a normal Supabase session, the rest of the authenticated app should continue to work without route-model changes:

- landing redirect behavior
- student dashboard loading
- teacher dashboard loading
- existing edge-function auth checks based on bearer token

## Security and Risk Posture

This design is intentionally light.

Known trade-offs:

- Anyone who knows a valid student's `LRN + Last Name` may be able to access that student account.
- This is not appropriate for long-term or high-assurance identity management.

Accepted mitigation for this project:

- use LRN as the unique student identifier
- require last name at login as a lightweight second factor
- keep failures generic on the client
- keep detailed diagnostics in server logs only

## Testing Strategy

The repository currently has no existing automated test suite checked in for this area, so this change should add the smallest useful automated coverage around the new auth logic and then rely on app-level verification.

Minimum coverage:

- LRN normalization helper behavior
- last-name normalization helper behavior
- student register happy path
- student register duplicate-LRN rejection
- student login success with correct `LRN + Last Name`
- student login failure with wrong last name
- teacher login regression check

Minimum verification commands after implementation:

- `npm run typecheck`
- `npm run build`

Minimum manual smoke checks:

- teacher can still sign up and log in with email/password
- student can sign up with `LRN + Class Code + Last Name`
- student can log in with `LRN + Last Name`
- student login fails with the wrong last name
- successful student auth lands on the student dashboard with a valid session

## Rollout Notes

- No migration should modify previously applied schema files.
- New edge functions should be additive.
- Existing teacher flows should remain available throughout the change.
- Existing student email/password accounts, if any, are not treated as the primary compatibility target for this short-lived system; the new LRN-based path becomes the supported student flow.
