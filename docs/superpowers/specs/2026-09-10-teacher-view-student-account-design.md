# Teacher View Student Account Design

## Context

MathVenture currently provisions hidden student accounts through the teacher's Add Students flow, but the login page still exposes a public name-based student login. The requested workflow is teacher-led and supervised: a teacher logs in, adds a student, selects that student's account, and views the student dashboard and quizzes in the same browser. The teacher must be able to return to the teacher account without signing in again.

## Goals

- Make the public login flow teacher-only.
- Let a teacher view a student account only after that student has been added to the teacher's classroom.
- Preserve the teacher session while the student account is active.
- Allow a clear, reversible return to the teacher account.
- Ensure student dashboard and quiz requests use the selected student's authenticated context.
- Prevent teacher data from appearing while the student account is active.

## Non-goals

- Creating independent student passwords or student self-registration.
- Replacing the existing teacher Add Students import/manual-entry flow.
- Building a general-purpose impersonation system for arbitrary users.
- Changing quiz scoring, assignment rules, or classroom membership behavior beyond the access control needed for view mode.

## Recommended architecture

Use two isolated Supabase auth clients in the browser:

1. The primary client retains the teacher's normal persisted session.
2. A secondary client uses its own auth storage key and tab-scoped storage for the selected student session.

The teacher session is never converted into a student session. The active client determines the app's visible profile and supplies the bearer token for ordinary Edge Function requests. The view-as request itself always uses the teacher client explicitly.

The auth provider will track the active profile and whether a student view is active. It will expose operations to enter student view, return to the teacher account, and sign out of both clients. Switching modes clears role-sensitive React Query data and refetches data under the new active session.

## Data flow

1. The teacher signs in through `/login` with email and password.
2. The teacher opens the classroom roster and selects `View Account` for a student.
3. The client calls a teacher-authenticated Edge Function with the selected student ID.
4. The Edge Function loads the teacher profile, verifies the teacher owns the relevant classroom, verifies the student is a member of that classroom, and issues a short-lived student session payload for that exact account.
5. The secondary Supabase client verifies the returned session payload and becomes the active client.
6. The app exposes the existing student routes and student navigation, then loads student data through the secondary client's bearer token.
7. `Return to teacher account` signs out only the secondary client, restores the teacher profile as active, clears role-sensitive cache entries, and routes to the teacher workspace.
8. Global sign-out signs out both clients, clears the secondary session, clears cached app data, and returns to the landing page.

The existing public name-based student-login path will be removed from the login UI and disabled server-side. Student sessions will therefore be created only through the teacher-authorized view flow.

## UI changes

- Remove the role selector and student name fields from the login page.
- Keep teacher signup as the only signup flow.
- Add a `View Account` action to each teacher roster row.
- Add a confirmation or explicit transition state showing the selected student's name before switching.
- Add a persistent student-view banner containing the student's name and `Return to teacher account`.
- Use student navigation and routes while student view is active.
- Hide teacher-only navigation and actions while student view is active.

## Authorization and failure handling

- The view-as Edge Function accepts requests only from authenticated teacher profiles.
- The server, not the browser, verifies classroom ownership and student membership.
- An arbitrary student ID, a student outside the teacher's classroom, an unauthenticated request, or a student-role request receives an authorization error.
- If session creation fails, the teacher session remains active and the UI shows an actionable error.
- If the student session expires or becomes invalid, the app exits student view, keeps the teacher signed in, and reports that the student view ended.
- Tab-scoped secondary storage limits the student session to the supervised browser tab.
- Teacher-only Edge Functions remain protected by their existing role checks.

## Testing strategy

Add or update tests for:

- Teacher-only login rendering and submission.
- Successful view-as authorization for a roster student.
- Rejection of unauthenticated, non-teacher, non-member, and arbitrary-student requests.
- Establishing the isolated student session without replacing the teacher session.
- Returning to teacher mode and signing out of both sessions.
- Student dashboard, classroom, assignment, and quiz requests using the student client.
- Cache invalidation and prevention of teacher roster/report data in student mode.
- Existing add-student, assignment, quiz, and reports tests remaining green.

## Acceptance criteria

- A user can log in through the public login page only as a teacher.
- A teacher can add a student and immediately see that student in the roster.
- The teacher can choose `View Account` for that student and land in the student's normal dashboard.
- The selected student can access the quiz through the normal student flow.
- The teacher can return to the teacher workspace without re-authenticating.
- The teacher session remains intact throughout the transition.
- A student cannot use the old public name-based login to create a session.
- A teacher cannot view a student who is not in the teacher's classroom.
- All affected local checks pass.
