# Teacher Dashboard Redesign

## Summary

Replace the current teacher dashboard card-and-metrics landing page with a classroom-oriented teacher workspace based on the approved sketches.

The teacher experience should center on two views:

- `My Classes` at `/teacher`
- a selected class workspace at `/teacher/classes/:classId`

This redesign should preserve the existing route structure, keep `Reports` and `Settings` visible in the teacher rail as placeholders for later work, and add accurate per-game student progress tracking so the `Student Progress` table reflects real passable game results instead of topic-level averages.

## Goals

- Make `/teacher` the default `My Classes` home.
- Make `/teacher/classes/:classId` the primary class workspace.
- Match the high-level flow and hierarchy shown in the approved sketches.
- Show a classroom-style left rail with teacher identity, navigation, and logout.
- Show class cards with join codes and an obvious `Enter` action.
- Add `Student List` and `Student Progress` tabs to the class workspace.
- Show `Last Name`, `First Name`, `Added/Joined`, and `Actions` in the list tab.
- Show `Last Name`, `First Name`, `% of app completed`, and `% on last played` in the progress tab.
- Support removing a student from a class without deleting the student account or the student’s historical progress.
- Add real per-game tracking so progress is computed from passed games at a `75%` threshold.

## Non-Goals

- Defining the real flows and content for `Reports`.
- Defining the real flows and content for `Settings`.
- Implementing the future `+ Add` student flow.
- Reworking teacher authentication.
- Replacing the current student-facing lesson flow.
- Backfilling old topic-level attempts into guessed per-game history.

## Chosen Direction

The approved direction is `A. Route-Preserving Classroom Workspace`.

This direction keeps the existing teacher routes but repurposes them:

- `/teacher` becomes `My Classes`
- `/teacher/classes/:classId` becomes the class workspace

This matches the sketches, avoids unnecessary routing churn, preserves deep links, and leaves room for later `Reports` and `Settings` pages without forcing a larger teacher-area rewrite now.

## Product Constraints

- `My Classes` must be the teacher landing page.
- `Reports` and `Settings` stay visible in the teacher navigation but remain placeholders for now.
- `Student Progress` must be based on real per-game results, not topic-level averages.
- A game counts as completed only when the student earns at least `75%` on that game.
- `% on last played` must come from the student’s latest individual game result, not from the latest topic aggregate.
- `Added/Joined` is a date display, not a status label.
- The `+ Add` control is visible in the class workspace to match the sketch, but it does not receive a real add-student workflow in this phase.
- If database changes are needed, each new schema change must be created as its own new PostgreSQL migration file rather than editing old migration files.

## User Experience

## Teacher Shell

The teacher area should feel like one rounded classroom board with:

- a narrow left rail for teacher profile and navigation
- a larger right content panel for classes and class details

The left rail should include:

1. profile/avatar area
2. welcome text with teacher name
3. `My Classes`
4. `Reports`
5. `Settings`
6. logout

The visual direction should feel simpler and more classroom-like than the current dashboard metrics view. The layout should prioritize class navigation over summary analytics.

## My Classes Page

`/teacher` becomes the `My Classes` page.

The page should include:

- `My Classes` heading
- `+ Create Class` action
- a responsive grid of class cards

Each class card should show:

- class name
- join code
- `Enter` action

Clicking the card or `Enter` should open `/teacher/classes/:classId`.

If no classes exist yet, the empty state should focus on creating the first class instead of showing analytics messaging.

## Class Workspace

`/teacher/classes/:classId` becomes the selected class workspace.

The top area should show:

- class name
- class join code

The main workspace should show two tabs:

1. `Student List`
2. `Student Progress`

The class workspace should also keep the visible `+ Add` control from the sketch, but this control remains a placeholder in this phase.

## Student List Tab

The `Student List` tab should display a table with these columns:

1. `Last Name`
2. `First Name`
3. `Added/Joined`
4. `Actions`

`Added/Joined` should display the class join date in a human-readable date format.

`Actions` should include a remove action that removes the student from that class only.

Removing a student must:

- remove the `class_students` relationship row
- keep the student profile intact
- keep existing attempts and detailed game history intact
- require a confirmation step before the removal is submitted

If the class has no students yet, the empty state should explain that no students have joined the class yet.

## Student Progress Tab

The `Student Progress` tab should display a table with these columns:

1. `Last Name`
2. `First Name`
3. `% of app completed`
4. `% on last played`

`% of app completed` means:

- count the total number of distinct playable games in the app
- count how many of those games the student has passed with a score of `75%` or higher
- divide passed game count by total game count
- display the result as a percentage

A game should count only once toward completion, even if the student replays it and passes it multiple times.

`% on last played` means:

- find the student’s most recent detailed individual game result
- display that game’s score percentage

If the student has no detailed per-game history yet, the progress fields should show `--`.

## Name Display Rule

The current data model stores student names as `full_name`.

For this phase, the class tables should derive name columns from that existing field instead of introducing a broader auth/profile rewrite.

Display rules:

- `Last Name` uses the final token of `full_name`
- `First Name` uses the preceding token(s)
- if there is only one token, show that token in `First Name` and show `--` in `Last Name`

This keeps the behavior deterministic for the current data model while staying scoped to the teacher dashboard work.

## Data Model And Tracking

## Detailed Game Results

The current app stores topic-level attempts, which are not sufficient for the approved teacher progress table.

This redesign should add a dedicated detailed result model for individual games within the app. The implementation should use a new database table for per-game results rather than overloading the existing topic attempt row.

The detailed per-game result record should support:

- which student played
- which topic the game belongs to
- which specific game within that topic was played
- score
- max score
- percentage
- completion timestamp
- optional link back to the parent topic attempt when relevant

The purpose of the new table is to let teacher progress be computed from real game-level evidence.

## Stable Game Identity

The app needs a stable game catalog so each playable game has a deterministic identity.

The implementation should define a shared catalog of playable games based on the current lesson flow order. Each game should have a stable id that does not depend on display copy.

Examples of acceptable identity structure:

- topic id
- game order within topic
- optional explicit game slug

The important part is that the same playable unit always maps to the same id.

## Score Semantics

Detailed game tracking should record a real `score` and `maxScore` for each game.

For activities that already expose a score, the detailed record should use that actual score.

For activities that currently only expose completion, the implementation may record completion as a binary success result for that game in this phase, provided the result still maps cleanly into the same `score/maxScore` structure.

The pass rule is fixed:

- passed if `score / maxScore >= 0.75`

## Legacy Data Behavior

Older attempt rows only contain topic-level totals and cannot be safely expanded into real game-level history without guessing.

To keep progress honest:

- old topic-level attempts remain stored as-is
- progress tables must not fabricate detailed game history from them
- students with no detailed game results show `--` in the detailed-progress cells

## Required Backend Changes

Backend work expected by this redesign includes:

- a new PostgreSQL migration file for the detailed game result table
- any supporting index changes in their own new migration files if additional schema updates are needed
- a teacher-safe edge function or API path for removing a student from a class
- updates to roster/progress responses so teacher pages receive the new derived table fields

The remove-student backend behavior must be limited to class membership removal only.

## Required Frontend Changes

Frontend work expected by this redesign includes:

- teacher shell styling that matches the classroom-board layout
- `/teacher` page rewrite into the `My Classes` grid view
- `/teacher/classes/:classId` rewrite into the tabbed class workspace
- `Student List` and `Student Progress` table components or clearly separated sections
- confirmation UI for removing a student from a class
- a visible placeholder `+ Add` control with no real flow yet
- lesson/game instrumentation so detailed per-game results are submitted during play

## Component Boundaries

The teacher redesign should be decomposed into focused responsibilities:

- teacher shell / teacher rail
- teacher classes home page
- class card component
- teacher class workspace page
- student list table
- student progress table
- remove-student confirmation UI
- shared game catalog / detailed progress helpers

The goal is to keep the page rewrite manageable and avoid concentrating all teacher behavior in one large file.

## Routing Responsibilities

The route contract after this redesign should be:

- `/teacher` -> `My Classes`
- `/teacher/classes/:classId` -> class workspace
- `/teacher/assignments` should no longer be the primary teacher surface for this flow and may be retired or replaced by a placeholder if it conflicts with the approved navigation

Because `Reports` and `Settings` are not defined yet, implementation may use temporary placeholders or route stubs for those entries instead of inventing full pages.

## Responsive Behavior

## Desktop

Desktop should preserve the classroom-board composition:

- fixed-feeling left rail
- spacious right workspace
- class cards shown in a grid
- tables kept readable without collapsing the main structure

## Mobile

On mobile:

- the left rail can stack above the content area
- class cards collapse to a single column
- tables may scroll horizontally
- the class workspace should remain usable without losing the two-tab structure

## Testing Strategy

Minimum implementation verification should cover:

- teacher landing page renders as `My Classes`
- class card navigation opens the correct class workspace
- class creation still works from the redesigned teacher home
- `Student List` shows the approved columns
- `Student Progress` shows the approved columns
- remove-student confirmation works and only removes class membership
- progress aggregation uses detailed per-game records only
- `75%` pass threshold is applied consistently
- legacy students with no detailed history show `--`
- responsive layout works for teacher home and class workspace
- placeholder `Reports`, `Settings`, and `+ Add` controls do not break navigation

## Manual Acceptance Criteria

The redesign is successful when:

1. A teacher logs in and lands on `/teacher`.
2. The first teacher screen is `My Classes`, not the old analytics dashboard.
3. Each class card shows the class name and join code and can be entered.
4. Opening a class shows `Student List` and `Student Progress`.
5. `Student List` includes `Last Name`, `First Name`, `Added/Joined`, and `Actions`.
6. `Actions` can remove a student from that class only after confirmation.
7. `Student Progress` includes `% of app completed` and `% on last played`.
8. `% of app completed` counts passed games only, using a `75%` threshold.
9. Old topic-only history does not produce fake detailed progress.
10. Database schema changes, if needed, are added as separate new PostgreSQL migration files.

## Implementation Notes

- Keep the scope focused on the teacher dashboard and class workspace only.
- Do not invent the real flows for `Reports`, `Settings`, or `+ Add` yet.
- Prefer explicit helpers for game identity and progress math over embedding that logic directly inside page components.
- Avoid changing unrelated student-facing flows unless required to emit detailed game results.
- Preserve existing teacher class creation behavior while changing the surrounding presentation.
