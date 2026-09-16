# Teacher Dashboard Rebuild Design

## Context

MathVenture's teacher surface currently spreads related classroom actions across overlapping views. The main teacher route combines multiple views in a select control, reports live on a separate route, settings is a placeholder, and legacy class routes redirect into the same workspace. This makes the product harder to learn and creates the impression that features are duplicated or missing.

The rebuild keeps the existing API endpoints and teacher functionality while giving every feature one canonical home in a clear, responsive dashboard shell.

## Goals

- Make the teacher experience understandable for teachers with limited technical experience.
- Make `/teacher` an attention-first Today dashboard.
- Give Students, Assignments, Reports, and Settings one clear destination each.
- Preserve existing Supabase function endpoints, React Query hooks, mutations, PDF exports, and student-account viewing.
- Keep legacy teacher URLs valid through safe redirects.
- Carry MathVenture's distinctive jungle/classroom feeling into a more professional teacher interface.
- Improve scanability through strong left alignment, readable numbers, clear labels, and low visual noise.

## Non-goals

- No new backend endpoints, migrations, or API payload changes.
- No new account or classroom settings that are not supported by the existing frontend/auth surface.
- No removal of existing teacher actions such as add/import students, remove students, assign quizzes, view a student account, report filtering, or PDF exports.
- No changes to student-facing gameplay or the student portal.

## Information architecture

The shared teacher shell exposes five destinations:

| Route | Canonical purpose |
| --- | --- |
| `/teacher` | Today: classroom snapshot, students needing attention, recent activity, and quick actions |
| `/teacher/students` | Roster, progress, add/import, remove, and view-as-student |
| `/teacher/assignments` | Create assignments, review assigned quizzes, inspect status, retry loading, and export PDFs |
| `/teacher/reports` | Report window, classroom summary, attention list, activity, student performance, topic breakdown, and PDF export |
| `/teacher/settings` | Existing account/session and supported app settings only |

Legacy route behavior:

- `/teacher/classes` redirects to `/teacher/students`.
- `/teacher/classes/:classId` redirects to `/teacher/students`.
- `/teacher/reports/classes/:classId` redirects to `/teacher/reports`.

The sidebar is persistent on larger screens and becomes a labeled drawer on smaller screens. The current route is indicated by both text and a clear visual state; icon-only navigation is not used.

## Visual direction

The teacher surface uses an **Organic MathVenture** direction: a calmer, professional interpretation of the existing jungle/classroom style.

- Main surface: sand `#E8DCC7`.
- Structure/navigation: sage `#8B9D83` and moss `#606C38`.
- Attention and primary actions: terracotta `#C66B3D`.
- Secondary emphasis: ochre `#C08E3A`.
- Typography: Epilogue as the warm geometric typeface.
- Texture: subtle 1–3% grain using a restrained SVG turbulence overlay.
- Layout: strong left alignment, hairline separators, stable column rhythm, and generous readable spacing.
- Depth: mostly flat surfaces and borders with minimal shadow.
- Components: use flat sections, tables, and action rows instead of a grid of disconnected floating cards.
- Motion: gentle 300–500ms transitions for navigation, drawer, and state changes; no distracting continuous animation.

The signature visual is a restrained **learning trail**: a vertical progress spine that connects Today attention items, recent activity, and the next action. It provides MathVenture character without using child-oriented decoration or replacing ordinary UI labels with themed copy.

## Page behavior

### Today

Today reads the existing classroom, roster, assignment, and report data hooks. The primary content order is:

1. Page title and a short, literal description.
2. Classroom snapshot with students, activity, completion, and score values available from existing data.
3. Attention rail listing students returned by the existing report attention data, with the reason expressed in plain language and one direct next action.
4. Recent activity using existing report activity data.
5. Quick actions for Add students and Assign quiz.

The page must have explicit loading, empty, error, and retry states. When no attention items exist, the empty state confirms that there are no current flags instead of fabricating activity.

### Students

Students is the sole home for roster and student progress. The page keeps the existing add/import flow, removal confirmation, view-as-student action, and progress values together. The current select-based view switch becomes an accessible tab or segmented control with clear labels. Search or filtering is only added if it can be implemented from already-loaded roster data without changing APIs.

### Assignments

Assignments is the sole home for assignment creation and tracking. It reuses the existing assign dialog, assignment list, status values, retry state, and PDF action. The page presents creation as the primary action and makes assignment state readable without requiring the teacher to open multiple duplicate panels.

### Reports

Reports retains the current window choices (`7d`, `30d`, `quarter`, and `all`), classroom summary, attention list, recent activity, student performance, topic breakdown, and PDF export. The layout is reordered for scanability and uses the same visual system as Today. The existing query-string window state remains the source of truth.

### Settings

Settings only renders controls backed by the current auth/session or app state. Unsupported settings are not shown as disabled or decorative controls. The page includes the existing sign-out path and account information that is already available to the authenticated teacher.

## Data and interaction rules

- Keep `api.classes`, `api.assignments`, `api.reports`, and the existing auth client unchanged.
- Continue using the current React Query hooks and invalidation keys so mutations update Today, Students, and Assignments consistently.
- Keep `viewStudentAccount` behavior and return protection unchanged.
- Attention actions navigate to Students or Reports, not to a second copy of the same data.
- All action buttons use ordinary labels such as “Add students”, “Assign quiz”, “View student”, “Remove”, “Retry”, and “Download PDF”.
- Errors surface the actionable message already provided by the API when available, with a retry action where retrying is safe.
- Empty states describe the real absence of data and do not invent sample students, scores, or activity.

## Accessibility and responsive behavior

- Use semantic landmarks for sidebar, main content, navigation, headings, tables, dialogs, and forms.
- Maintain visible keyboard focus and sufficient contrast for sand, sage, moss, terracotta, and text combinations.
- Keep action labels visible at all breakpoints; icons may support labels but cannot replace them.
- Preserve the existing mobile drawer behavior for add-students and use the same interaction model for teacher navigation.
- Make tables horizontally scrollable only where necessary, with the most important student identity and action columns kept understandable on small screens.
- Respect reduced-motion preferences for the learning trail and page transitions.

## Verification

Verification is required in this order:

1. Run focused teacher navigation, page, and component tests.
2. Run the complete `npm test` suite.
3. Run `npm run typecheck`.
4. Run `npm run build`.

The rebuild is complete only when existing teacher functionality remains covered and all applicable local gates pass with fresh output. Remote GitHub Actions are unverified if no workflow or credentials are available.

