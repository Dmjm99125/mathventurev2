# Teacher Reports

## Summary

Turn the teacher `Reports` placeholder into a real reporting workflow that starts with a cross-class overview and drills into a dedicated class report.

The first version should help teachers compare classes, identify students who may need attention, spot recent momentum, and export a PDF summary for a selected class.

This feature should stay inside the existing teacher classroom shell instead of introducing a separate analytics-style area.

## Goals

- Turn `/teacher/reports` into a real reports landing page.
- Make the reports landing page start with cross-class comparison.
- Let teachers drill into `/teacher/reports/classes/:classId` for a class-specific report.
- Show students needing attention as a cross-class shortlist.
- Show recent activity and quiet classes for the selected preset window.
- Support preset time windows instead of freeform date picking.
- Support PDF export for the current class report view.
- Keep report math server-side so UI and export stay consistent.

## Non-Goals

- Building a spreadsheet or CSV export flow in this phase.
- Exporting the full cross-class overview as a PDF in this phase.
- Adding freeform date-range inputs.
- Introducing live-refresh analytics or background reporting jobs.
- Replacing the existing teacher class workspace.
- Reworking teacher authentication or student identity rules.
- Adding new reporting schema unless implementation proves it is necessary.

## Chosen Direction

The approved direction is `Dedicated Teacher Reports Hub`.

The reports experience is split into two report surfaces:

1. `/teacher/reports`
2. `/teacher/reports/classes/:classId`

The landing page is a cross-class overview. From there, the teacher opens a dedicated class report. PDF export is available from the class report only in the first version.

## Product Constraints

- `/teacher/reports` must be the reports landing page.
- The landing page priority order is:
  1. class performance comparison
  2. students needing attention
  3. recent activity and momentum
  4. export-ready summary access
- A class report must show the student table first and the topic/game breakdown below it.
- Time filtering uses preset windows only.
- The approved preset windows are:
  - `Last 7 days`
  - `Last 30 days`
  - `This quarter`
  - `All time`
- PDF export is the first and only required export format in this phase.
- PDF export starts from the class-detail report only, not the cross-class landing page.
- Reports should use trustworthy detailed game-result history instead of inventing estimates from topic-level totals.
- If database changes are needed, each new change must go into its own new PostgreSQL migration file.

## User Experience

## Teacher Shell

The reports area should stay inside the same teacher classroom board already used by `My Classes` and class workspaces.

The reports pages should preserve:

- the left teacher rail
- the rounded board frame
- the warm classroom palette
- a spacious content panel

Reports should feel like part of the same teacher product, not a separate admin console.

## Reports Landing Page

`/teacher/reports` becomes the cross-class reports hub.

The page should be structured from top to bottom like this:

1. preset window controls
2. class performance comparison
3. students needing attention
4. recent activity and momentum
5. compact report-export guidance

The page should prioritize scanability over dense dashboards. It should avoid small, hard-to-read metric tiles that become fragile on mobile.

## Preset Window Controls

The reports landing page and class-detail page should share the same preset-window model.

The approved windows are:

- `Last 7 days`
- `Last 30 days`
- `This quarter`
- `All time`

The selected preset should remain visible and should carry through when the teacher drills from the landing page into a class report.

Reports must not silently fall back to `All time` if a chosen window has no data.

## Class Performance Comparison

The first and most prominent section on the reports landing page should compare classes.

Each class summary row or card should help a teacher answer:

- Which classes are strongest right now?
- Which classes are struggling right now?
- Which classes are active versus quiet?

Each class summary row or card must include these signals:

- class name
- student count
- average score percentage for the selected window
- count of students active in the selected window
- class completion signal for the selected window
- most recent activity timestamp in the selected window
- `View class report` action

This section is the main entry point into class-detail reports.

## Students Needing Attention

The second section on the landing page should be a cross-class shortlist, not a full roster.

Its purpose is to help the teacher quickly identify students who may need follow-up.

The list should be deterministic rather than editorial. A student appears here only when they match clearly defined report rules within the selected window.

Each attention-list row must include:

- student name
- class name
- attention reason or signal
- a small summary of the relevant metric
- a route into the relevant class report

## Recent Activity And Momentum

The third section should answer what changed recently, rather than repeat the same averages already shown above.

This section should contain three compact sub-sections:

- classes with the most recent play activity
- students who most recently passed a game
- classes with no activity in the selected window

The purpose is to give the teacher a sense of momentum and quiet spots without overwhelming them with raw logs.

## Export Guidance

The final section on the landing page should stay compact.

In the first version, the landing page should explain that PDF export is available from the class report. It should not attempt to export the whole landing page in this phase.

This keeps the landing page focused on scanning and drill-down instead of mixing overview and document generation into one crowded surface.

## Class Report Page

`/teacher/reports/classes/:classId` becomes the dedicated class report view.

This page should preserve the selected preset window from the landing page and present the class report in this order:

1. class header
2. PDF export action
3. student-by-student report table
4. topic/game breakdown

The class header should include:

- class name
- class join code
- selected preset window

## Student Report Table

The student table is the primary body of the class report.

It should be richer than the progress table inside the class workspace because its purpose is comparison, not simple roster monitoring.

The table must include these columns:

- last name
- first name
- average score in the selected window
- completion percentage in the selected window
- most recent played score percentage in the selected window
- last activity date in the selected window

The table may support sorting in this phase, but it should not support editing or roster actions here.

## Topic And Game Breakdown

Below the student table, the class report should show an aggregated topic/game breakdown.

This section should help the teacher identify which parts of the app are strongest or weakest for the class during the selected window.

The breakdown should stay aggregated and readable. It should not collapse into a raw event log.

The breakdown should use this shape:

- topic-level summary first
- expandable game rows under each topic summary

This keeps the first version useful without making the page overwhelming.

## PDF Export

In the first version, PDF export should be available only from the class report page.

The teacher flow is:

1. choose a preset window
2. open a class report
3. export that current class report as PDF

The exported PDF should reflect the same selected window and the same underlying aggregated data used by the on-screen class report.

The PDF should include:

- class name
- selected preset window
- generated date
- student summary table
- topic/game breakdown

If the selected window has no reportable data, PDF export should be disabled with clear copy instead of generating a near-empty document.

## Data And Reporting Semantics

## Window Semantics

The meaning of each preset window should be explicit:

- `Last 7 days`: report on detailed game results from the last 7 calendar days
- `Last 30 days`: report on detailed game results from the last 30 calendar days
- `This quarter`: report on detailed game results from the current calendar quarter
- `All time`: report on all available detailed game-result history

Every section on the landing page and class report page should use the same resolved window boundaries.

## Data Sources

The first version should reuse existing app data wherever possible.

Expected data sources include:

- `classes`
- `class_students`
- `profiles`
- `attempt_game_results`
- the shared game catalog and progress helpers

The design should not depend on creating a new report table in order to be valid.

## Trustworthy Progress Rules

Reports should stay aligned with the existing teacher progress rules:

- detailed game rows are the source of truth
- completion is based on passed games only
- the pass threshold remains `75%`
- a game counts once toward completion even if passed multiple times

Older topic-only attempts must not be expanded into guessed detailed history.

If a selected window or student has no detailed history, the report should show an honest empty or partial state rather than inferred metrics.

## Class Comparison Semantics

Each class comparison row should summarize the selected window using metrics that teachers can understand without explanation.

At minimum, the overview should derive:

- average score percentage in the selected window
- number of students with any activity in the selected window
- class completion signal based on passed games in the selected window
- latest activity timestamp in the selected window

The class completion signal should be the average of each currently enrolled student's window completion percentage, treating students with no passed games in the selected window as `0%`.

If a class has no reportable activity in the selected window, it should still be visible but clearly marked as inactive or empty for that window.

## Attention List Rules

The `students needing attention` list should use explicit rules, not subjective copywriting.

A student appears in the list when one or more of these are true within the selected window:

- their weighted average score is below `75%`
- they have no activity in the selected window while at least one other student in the same class has activity in that window
- their window completion percentage is below `10%`

The attention reason shown in the UI should map directly to the triggered rule or rules. The rule system must be deterministic, testable, and visible in code rather than hidden in presentation logic.

## Backend Contract

The reports feature should use dedicated reporting contracts rather than stretching `dashboard-teacher` or `classes-roster` beyond their current jobs.

The backend should provide separate report-oriented entrypoints for:

- reports overview payload
- class-detail report payload
- PDF export payload or generation path

These entrypoints should be teacher-only and should verify class ownership where relevant.

## Server-Side Aggregation

Report aggregation should stay server-side.

The client must request one of these preset-window keys:

- `7d`
- `30d`
- `quarter`
- `all`

The backend should resolve the time window and return already-aggregated report data. The frontend should not recompute report math independently.

This keeps:

- UI summaries
- class-detail tables
- PDF export content

consistent with one another.

## Database Expectations

The first version should aim to ship without new schema if performance and query shape remain acceptable.

If implementation proves a schema addition is necessary, the change must follow these rules:

- create a new PostgreSQL migration file
- do not edit old migration files
- keep each schema concern isolated to its own migration file

That rule applies to any new index, view, table, or other persistent database structure introduced for reports.

## Error And Empty States

## Empty States

If a preset window has no reportable data:

- the landing page should show honest empty states for its report sections
- the class report should stay on the chosen window and explain that no data exists for that period
- the UI must not silently switch to a broader window

## Load And Failure States

If report data fails to load:

- keep the teacher inside the reports page shell
- show retry-friendly error states in the report body
- avoid full-page crashes or route ejection

If PDF generation fails:

- keep the teacher on the class report page
- show a direct, local error message
- preserve the selected preset and current report context

## Responsive Behavior

## Desktop

On desktop, the reports pages should preserve the classroom-board composition:

- left rail stays visible
- the right panel remains spacious
- class comparison sections can use wider tables or cards
- the student report table stays the dominant class-detail element

## Mobile

On mobile:

- the teacher rail may stack above the reports content
- landing-page sections should stack vertically
- comparison content should remain readable without collapsing into tiny cards
- large tables may scroll horizontally
- preset controls should remain usable without crowding the header

The reports layout should consume the available page width rather than shrinking into a narrow analytics island.

## Testing Strategy

Minimum implementation verification should cover:

- `/teacher/reports` renders as the reports landing page
- `/teacher/reports/classes/:classId` renders as the class report page
- the selected preset window affects all landing-page sections consistently
- drilling from the overview into a class report preserves the selected window
- classes with no activity in the selected window remain visible with honest empty states
- the attention list rules behave deterministically
- class-detail student metrics use detailed game results only
- topic/game breakdown respects the selected preset window
- PDF export is available from the class report only
- PDF export uses the same selected window and report data as the on-screen class report
- PDF export is disabled when the selected window has no reportable class data
- report load failures stay inside the reports shell and offer retry behavior
- mobile layout remains usable for both the landing page and class-detail report

## Manual Acceptance Criteria

This feature is successful when:

1. A teacher opens `/teacher/reports` and sees a real reports landing page.
2. The first section emphasizes cross-class comparison.
3. The second section surfaces students needing attention across classes.
4. The third section surfaces recent activity or quiet classes for the selected preset window.
5. The page offers preset windows only: `Last 7 days`, `Last 30 days`, `This quarter`, and `All time`.
6. Opening a class report keeps the teacher inside the `Reports` tab.
7. A class report shows the student table first and the topic/game breakdown below it.
8. The report metrics are based on detailed game-result history and the existing `75%` pass rule.
9. A class with no data in the selected window shows an honest empty state instead of silently widening the range.
10. PDF export is available from the class report and reflects the current selected preset window.
11. If schema work is needed during implementation, it is added through new PostgreSQL migration files only.

## Implementation Notes

- Keep the scope focused on teacher reports only.
- Reuse the existing teacher classroom shell and navigation.
- Prefer dedicated reporting endpoints over overloading current teacher dashboard endpoints.
- Keep report math on the server so UI and PDF stay aligned.
- Start PDF export from the class report only, not from the cross-class landing page.
- Avoid creating reporting schema unless implementation shows a clear need.
