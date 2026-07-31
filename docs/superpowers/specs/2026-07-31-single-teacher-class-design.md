# Single Teacher Classroom Refactor

## Summary

Refactor MathVenture from a multi-class product into a single-classroom product where each teacher account owns exactly one hidden classroom.

The classroom record remains in the database as internal plumbing, but the product no longer exposes class creation, class selection, class names, or class codes anywhere in the UI.

Teacher and student flows should feel like they operate inside one shared classroom context instead of navigating between multiple classes.

## Goals

- Enforce `one teacher account = one classroom` as a hard product rule.
- Remove visible multi-class UI from the teacher and student experiences.
- Remove class-code based enrollment from student registration.
- Keep existing assignments, attempts, posts, and reports attributable through the current `class_id` model.
- Make teacher roster and report pages resolve the teacher's classroom automatically.
- Keep the refactor safe by reusing the existing classroom-centered backend model where practical.
- Apply any database changes through a brand new migration file only.

## Non-Goals

- Rewriting the entire data model to remove `classes` and `class_students` in this phase.
- Supporting more than one classroom per teacher in any hidden or experimental mode.
- Preserving visible class names, class cards, or join codes in the product.
- Designing a second student identity system beyond the current name-based hidden-account approach.
- Solving every duplicate-name edge case across all teachers in this phase.
- Reworking unrelated gameplay, lesson content, or student progress math.

## Chosen Direction

The approved direction is `Hidden Singleton Classroom`.

Each teacher continues to have one backing row in `public.classes`, but that row becomes an internal implementation detail instead of a user-facing concept.

The app removes all visible multi-class behavior and resolves the teacher's classroom server-side whenever teacher or student flows need classroom attribution.

## Product Constraints

- Each teacher must end up with exactly one classroom row.
- The classroom row must not be user-created, user-selected, or user-renamed in the product.
- No user-facing flow may require or display a class code.
- No user-facing flow may require or display a class name.
- Teacher-facing pages should refer to the space generically as the teacher's classroom, workspace, roster, or reports.
- Student self-registration must accept teacher first name instead of class code.
- Teacher pre-provisioning must remain supported.
- Existing `class_id` foreign-key relationships should remain valid after the refactor.
- Any schema work must be added in a new PostgreSQL migration file and must not rewrite prior migrations.

## User Experience

## Teacher Experience

The teacher experience becomes a single workspace rooted at `/teacher`.

The page should load the teacher's hidden classroom automatically and present one roster/progress workspace instead of a class index.

Visible teacher behaviors removed from the product:

- `Create Class`
- class cards
- class list views
- class name headers
- join code display

The teacher shell should still preserve the current classroom-board visual language, but the content becomes singular rather than multi-class.

Recommended top-level teacher information hierarchy:

1. classroom roster and add-students flow
2. student progress
3. classroom posts or announcements
4. reports

## Teacher Reports Experience

Teacher reports remain available, but they no longer begin with cross-class comparison because cross-class behavior is gone.

The reports area should focus on one classroom only:

- classroom performance summary
- student attention list
- recent activity
- detailed classroom report
- PDF export

Approved teacher route direction:

- `/teacher` becomes the main classroom workspace
- `/teacher/reports` becomes the single classroom reports hub and contains the detailed classroom report plus PDF export
- legacy routes such as `/teacher/classes`, `/teacher/classes/:classId`, and `/teacher/reports/classes/:classId` should redirect safely after links are updated

## Student Experience

Students also operate in one classroom context.

Visible student behaviors removed from the product:

- joining a class with a code
- navigating between multiple classes
- seeing "more classes" summaries
- opening class-specific destinations chosen from a list

The student dashboard should show the classroom context once and present assignments, announcements, and lesson entry without implying multiple classrooms.

The current class-detail experience should move to `/student/classroom`.

`/student` remains the main dashboard.

`/student/classroom` becomes the only classroom-detail destination for announcements and pending assignments.

## Enrollment Experience

Two enrollment paths remain supported:

1. Teacher pre-provisions students first.
2. Student self-registers into the teacher's classroom.

### Teacher Pre-Provisioning

The teacher add/import students workflow remains the primary roster-management path.

It should no longer ask the frontend for classroom selection. The backend should resolve the teacher's hidden classroom automatically and add each created student into that classroom.

### Student Self-Registration

Student self-registration should replace `classCode` with:

- `teacherFirstName`
- `studentFirstName`
- `studentLastName`

Registration semantics:

1. Normalize the teacher first name and student name fields.
2. Resolve the teacher account by first name.
3. Resolve that teacher's hidden classroom.
4. Check whether a pre-provisioned matching student already exists in that teacher's classroom.
5. If a matching pre-provisioned student exists, issue the student session for that account.
6. If no matching student exists, create a hidden student account and enroll it into that teacher's classroom.

The flow must not mention class codes anywhere.

### Student Login

Student login should also use teacher first name as part of identity resolution.

Approved login inputs:

- `teacherFirstName`
- `studentFirstName`
- `studentLastName`

This reduces collisions between students with identical names under different teachers.

If multiple teachers share the same normalized first name and the app cannot resolve the student deterministically, the backend should fail honestly with an invalid-credentials style response instead of guessing.

## Routing And Navigation

## Teacher Routes

The final teacher route model should remove multi-class navigation from active product use.

Target behavior:

- `/teacher` renders the teacher's singleton classroom workspace
- `/teacher/reports` renders the single classroom reports page
- `/teacher/settings` remains available if still used

Legacy route handling:

- `/teacher/classes` should redirect to `/teacher`
- `/teacher/classes/:classId` should redirect to `/teacher` after validating ownership
- `/teacher/reports/classes/:classId` should redirect to `/teacher/reports` after validating ownership

## Student Routes

The student route model should also remove class-id driven navigation from primary use.

Target behavior:

- `/student` renders the main student dashboard
- `/student/classroom` renders classroom announcements and pending assignments
- lesson URLs may continue to include classroom attribution only if needed for backend compatibility, but the user should not choose among classrooms

Legacy route handling:

- `/student/classes/:classId` should redirect to `/student/classroom`

## Frontend Contract Changes

The frontend should stop thinking in terms of `classes[]` as a visible collection.

Recommended contract direction:

- teacher classroom query returns one resolved classroom context
- teacher roster query no longer requires a user-selected `classId`
- add-students and remove-student mutations no longer require the frontend to choose a classroom
- student classroom data returns either one classroom object or `null`, not a visible list
- reports views no longer render class comparison UI and should read from the singleton classroom context

If implementation keeps the existing `classes-list` endpoint temporarily, it should return at most one classroom and should not surface join codes or encourage selection.

## Backend And Data Model

## Hidden Singleton Classroom Model

The database should retain `public.classes` and `public.class_students` in this phase.

This keeps the current `class_id` relationships intact for:

- assignments
- attempts
- attempt game results via attempts
- class posts
- teacher reports

The classroom row becomes internal-only. User-facing code should not expose its `name` or `join_code`.

## Required Migration

Create a new migration file such as:

- `supabase/migrations/0009_single_teacher_class.sql`

The migration should:

1. backfill exactly one classroom for every existing teacher who lacks one
2. enforce `unique (teacher_id)` on `public.classes`
3. stop requiring join-code based product behavior
4. preserve valid classroom references for existing `class_students`, `assignments`, `attempts`, and `class_posts`
5. ensure future teacher accounts receive a hidden classroom automatically during account provisioning or the first teacher-only backend resolution path

If data already contains teachers with multiple classrooms, the migration should not silently guess how to merge them unless the merge rule is deterministic and lossless.

Approved safety rule:

- if multi-class data cannot be collapsed safely in SQL, the migration should fail loudly with a clear comment or guarded step so cleanup is intentional rather than accidental

## Singleton Resolution Helper

Introduce two explicit shared backend helpers:

- `ensureTeacherSingletonClass(teacherId)` for provisioning or backfill paths
- `getTeacherSingletonClass(teacherId)` for normal runtime reads

`getTeacherSingletonClass(teacherId)` should be the default path for classroom resolution in teacher-owned backend flows.

Helper responsibilities:

- `ensureTeacherSingletonClass(teacherId)` creates the backing classroom only when it is legitimately missing for a valid teacher account
- `getTeacherSingletonClass(teacherId)` loads exactly one classroom and fails if the singleton invariant is broken
- both helpers must share the same invariant rules so different endpoints cannot drift

## Backend Endpoint Direction

Class-oriented edge functions may remain in place temporarily, but they should become singleton-aware wrappers instead of true multi-class endpoints.

Examples:

- `classes-list` should effectively resolve one classroom context
- `classes-roster` should infer the teacher classroom when called from the teacher workspace
- `classes-add-students` should target the teacher's classroom automatically
- `classes-remove-student` should remove membership from the teacher's classroom automatically
- `posts-list` and `posts-create` should validate against the resolved singleton classroom
- `reports-overview` should load one-classroom reporting data instead of cross-class comparison
- `reports-class` may remain as an internal compatibility endpoint, but it should validate that the requested class matches the teacher's singleton classroom

## Assignment And Attempt Semantics

Assignments may continue storing `class_id` because that preserves current attribution and reporting behavior.

Teacher assignment creation should no longer involve selecting among multiple classrooms. If a classroom-level assignment is created, the backend should attach the teacher's singleton `class_id` automatically.

Student attempt submission should continue validating classroom attribution, but the frontend should be allowed to omit `classId` whenever assignment context or the student's singleton classroom is enough to infer it.

The backend should reject mismatched classroom identifiers instead of quietly accepting them.

## Reporting Direction

Teacher reports should keep using the shared server-side reporting dataset pattern, but the meaning changes from:

- compare many classrooms

to:

- analyze one classroom deeply

Required report changes:

- remove cross-class comparison emphasis from the user experience
- keep classroom-level student and topic breakdowns
- preserve PDF export where it still makes sense
- keep aggregation server-side so on-screen and exported data stay aligned
- make `/teacher/reports` the single destination for classroom reporting and export

If the reports implementation still needs a classroom identifier internally, it should use the teacher's singleton classroom automatically rather than exposing classroom selection.

## Authentication And Identity Rules

## Teacher Identity

Teacher accounts continue using email/password as they do now.

The refactor does not change teacher authentication.

## Student Identity

Student identity resolution becomes teacher-scoped.

The practical lookup key becomes:

- normalized teacher first name
- normalized student first name
- normalized student last name

This should be reflected consistently in:

- self-registration
- login
- hidden student provisioning checks
- ambiguous-match failure behavior

The system should not sign a student into the wrong teacher's classroom because of a duplicate name collision.

## Error And Empty States

## Enrollment Errors

If a teacher first name cannot be matched to a single teacher/classroom context:

- self-registration should fail with a clear classroom-not-found style message
- login should fail with an invalid-credentials style response

If a matching student cannot be resolved deterministically, the backend should fail safely instead of selecting the first partial match.

## Workspace And Reports Errors

If singleton classroom resolution fails because the database violates the one-teacher-one-class rule:

- keep the user in the current shell
- return a clear backend error
- avoid inventing fallback data

If a classroom has no posts, assignments, or reportable activity, the UI should show honest empty states without bringing back multi-class affordances.

## Responsive Behavior

The responsive goal does not change visually, but the information hierarchy should simplify because the class-selection layer is gone.

On desktop:

- preserve the spacious teacher board
- make the roster/progress workspace the primary teacher surface
- keep report sections readable without comparison grids for many classes

On mobile:

- avoid stacked class cards entirely
- keep the single classroom flow linear
- allow report tables to scroll horizontally where needed

## Testing Strategy

Minimum implementation verification should cover:

- every teacher resolves to exactly one classroom after the migration
- teachers with no prior classroom get one created safely
- newly created teacher accounts get a hidden classroom automatically
- multi-class teacher data fails safely or is merged only by explicit deterministic rules
- teacher workspace loads without class list or class creation UI
- teacher roster loads without selecting a classroom
- add-students adds students into the teacher's singleton classroom
- remove-student removes membership from the teacher's singleton classroom
- student self-registration works with teacher first name instead of class code
- student login works with teacher first name instead of class code
- ambiguous teacher-name or student-name matches fail safely
- student dashboard and classroom navigation no longer imply multiple classrooms
- posts and assignments still resolve through the backing classroom correctly
- attempt submission still attributes work to the correct classroom
- reports load as single-classroom reports rather than cross-class comparisons
- legacy class-id routes redirect safely or validate ownership correctly

## Manual Acceptance Criteria

This refactor is successful when:

1. A teacher signs in and lands in one classroom workspace rather than a classes list.
2. The teacher cannot create, rename, or choose among classes in the UI.
3. The teacher cannot see a class code anywhere in the product.
4. The teacher can still add students successfully.
5. A student can self-register using teacher first name, student first name, and student last name.
6. A pre-provisioned student can still sign in successfully.
7. Student pages no longer imply multiple classrooms or show class-selection UI, and `/student/classes/:classId` no longer acts as an active product route.
8. Assignments, announcements, attempts, and reports still work through the hidden backing classroom.
9. Reports reflect one classroom rather than comparing many classrooms.
10. All database changes for this refactor live in a new migration file rather than modifying old schema files.

## Implementation Notes

- Favor reuse of the current classroom-centered backend model over a full flatten-to-`teacher_id` rewrite.
- Keep the hidden classroom concept out of product copy wherever possible.
- Treat singleton classroom resolution as infrastructure, not as UI state.
- Prefer backend inference of classroom context over frontend-selected `classId` parameters.
- Remove class-code copy, fields, and help text everywhere they appear.
- If compatibility wrappers are kept temporarily, make them strict and short-lived rather than expanding them into a second long-term architecture.
