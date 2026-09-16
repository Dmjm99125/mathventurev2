# Teacher Dashboard Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the MathVenture teacher surface into a professional, responsive, attention-first dashboard with one canonical home for Today, Students, Assignments, Reports, and Settings while preserving all existing API endpoints and functionality.

**Architecture:** Keep the existing React Query/API layer and teacher feature components, replace the current shared workspace presentation with a single responsive teacher shell, and split page ownership by route. The Today route composes existing classroom, roster, assignment, and report data into a new attention rail; Students, Assignments, and Reports reuse their current flows inside the shell.

**Tech Stack:** React 19, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS v4, Radix UI, lucide-react, Deno tests.

## Global Constraints

- Keep existing Supabase function endpoints, React Query hooks, mutations, PDF exports, and student-account viewing behavior unchanged.
- Do not add backend endpoints, migrations, API payload changes, or student-facing changes.
- Use the Organic MathVenture visual system: sand `#E8DCC7`, sage `#8B9D83`, moss `#606C38`, terracotta `#C66B3D`, ochre `#C08E3A`, Epilogue typography, subtle grain, strong left alignment, large readable numbers, and minimal shadow.
- Every teacher feature has one canonical route: `/teacher`, `/teacher/students`, `/teacher/assignments`, `/teacher/reports`, `/teacher/settings`.
- Keep `/teacher/classes`, `/teacher/classes/:classId`, and `/teacher/reports/classes/:classId` valid through redirects.
- Do not invent sample students, scores, activity, account data, or unsupported settings.
- Preserve keyboard access, visible focus, semantic landmarks, labeled actions, reduced-motion behavior, and usable mobile layouts.
- After every code/test/configuration edit, run the smallest relevant local checks; completion requires `npm test`, `npm run typecheck`, and `npm run build` with fresh output.

---

## File map

- Modify `src/App.tsx` to expose the five canonical teacher routes and legacy redirects.
- Modify `src/pages/teacher.tsx` to make the page exports route-specific and to move each feature into its canonical section.
- Modify `src/components/teacher/TeacherWorkspaceBoard.tsx` to become the shared teacher shell layout.
- Modify `src/components/teacher/TeacherSidebar.tsx` to provide the five labeled nav destinations, account identity, sign-out, and responsive behavior.
- Modify `src/lib/teacher/navigation.ts` to define the canonical teacher nav and active-route logic.
- Modify `src/lib/i18n/useLanguage.tsx` to add literal Today navigation copy in English and Filipino.
- Modify `src/index.css` to add teacher-only Organic MathVenture tokens/utilities and a restrained grain treatment without changing student/game surfaces.
- Create `src/components/teacher/TeacherToday.tsx` for Today page composition and state handling.
- Create `src/components/teacher/TeacherAttentionRail.tsx` for attention items and direct actions.
- Create `src/components/teacher/TeacherClassroomSnapshot.tsx` for real classroom metrics.
- Create `src/components/teacher/TeacherRecentActivity.tsx` for Today activity rows, reusing report payload types.
- Modify `src/components/teacher/TeacherStudentListTable.tsx` and `src/components/teacher/TeacherStudentProgressTable.tsx` only for the new shared visual and action layout; keep their data contracts.
- Modify `src/components/teacher/TeacherAssignedQuizzes.tsx` only for the new shared visual and route context; keep nested score drill-down and PDF actions.
- Modify `src/components/teacher/reports/*.tsx` only for the new visual system and clearer section hierarchy; preserve report props and behavior.
- Modify `test/src/lib/teacher/navigation.test.ts` for the canonical nav and redirect-aware active states.
- Modify `test/src/components/teacher-workspace-board.test.ts` for shell composition and accessible nav ownership.
- Modify `test/src/pages/teacher-assignment.test.ts` for route-specific assignment ownership and preserved dialog hooks.
- Create `test/src/pages/teacher-dashboard.test.ts` for Today/Students/Reports/Settings source-level route contracts and no duplicate feature ownership.
- Create `test/src/components/teacher-today.test.ts` for attention rail, snapshot, loading, empty, error, and retry contracts.

## Task 1: Canonical teacher navigation and shell contract

**Files:**
- Modify: `src/lib/teacher/navigation.ts`
- Modify: `src/lib/i18n/useLanguage.tsx`
- Modify: `src/components/teacher/TeacherSidebar.tsx`
- Modify: `src/components/teacher/TeacherWorkspaceBoard.tsx`
- Test: `test/src/lib/teacher/navigation.test.ts`
- Test: `test/src/components/teacher-workspace-board.test.ts`

**Interfaces:**
- `TEACHER_NAV_ITEMS` produces `{ href: string; labelKey: string }[]` for Today, Students, Assignments, Reports, and Settings.
- `isTeacherNavActive(pathname: string, href: string): boolean` treats `/teacher` as Today only, `/teacher/students` as the Students section, `/teacher/assignments` as Assignments, `/teacher/reports` and its legacy drill-down as Reports, and `/teacher/settings` as Settings.
- `TeacherWorkspaceBoard` continues accepting `{ heading: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }` so existing page composition remains easy to migrate.

- [ ] **Step 1: Update the navigation tests first.**

Replace the old classes/reports/settings expectations with this contract:

```ts
Deno.test("teacher nav exposes one canonical route per feature", () => {
  assertEquals(TEACHER_NAV_ITEMS, [
    { href: "/teacher", labelKey: "teacher.today" },
    { href: "/teacher/students", labelKey: "teacher.students" },
    { href: "/teacher/assignments", labelKey: "teacher.assignments" },
    { href: "/teacher/reports", labelKey: "teacher.reports" },
    { href: "/teacher/settings", labelKey: "teacher.settings" },
  ]);
});

Deno.test("teacher nav keeps legacy routes inside their canonical section", () => {
  assertEquals(isTeacherNavActive("/teacher", "/teacher"), true);
  assertEquals(isTeacherNavActive("/teacher/classes", "/teacher"), false);
  assertEquals(isTeacherNavActive("/teacher/students", "/teacher/students"), true);
  assertEquals(isTeacherNavActive("/teacher/classes/class-1", "/teacher/students"), false);
  assertEquals(isTeacherNavActive("/teacher/reports/classes/class-1", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/settings", "/teacher/reports"), false);
});
```

- [ ] **Step 2: Run the focused tests to verify the old implementation fails.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/lib/teacher/navigation.test.ts test/src/components/teacher-workspace-board.test.ts`

Expected: FAIL because the old nav still exposes `teacher.classes` and the old shell assertions describe the previous layout.

- [ ] **Step 3: Implement the canonical nav, translations, and shell.**

Use the existing `wouter`/`useAuth`/`useLanguage` patterns. Add English/Filipino `teacher.today` strings, keep `common.logout`, and make the sidebar a semantic `<aside>` with a labeled `<nav>`. Keep account and sign-out actions in the shell. The shell must render one `<main>` content region and apply teacher-only classes such as `teacher-shell`, `teacher-grain`, and `teacher-learning-trail`.

Use a labeled mobile drawer trigger with `aria-expanded` and `aria-controls`, while retaining the existing desktop fixed rail behavior. Do not duplicate the nav in the page bodies.

- [ ] **Step 4: Run the focused tests to verify the shell contract passes.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/lib/teacher/navigation.test.ts test/src/components/teacher-workspace-board.test.ts`

Expected: PASS with canonical nav routes and a single sidebar-owned navigation landmark.

- [ ] **Step 5: Commit the shell boundary.**

```powershell
git add src/lib/teacher/navigation.ts src/lib/i18n/useLanguage.tsx src/components/teacher/TeacherSidebar.tsx src/components/teacher/TeacherWorkspaceBoard.tsx test/src/lib/teacher/navigation.test.ts test/src/components/teacher-workspace-board.test.ts
git commit -m "feat: establish teacher dashboard shell"
```

## Task 2: Today data composition and attention rail

**Files:**
- Create: `src/components/teacher/TeacherToday.tsx`
- Create: `src/components/teacher/TeacherAttentionRail.tsx`
- Create: `src/components/teacher/TeacherClassroomSnapshot.tsx`
- Create: `src/components/teacher/TeacherRecentActivity.tsx`
- Test: `test/src/components/teacher-today.test.ts`

**Interfaces:**
- `TeacherToday` accepts `{ onAddStudents(): void; onAssignQuiz(): void; onViewStudent(studentId: string): Promise<void> }` and owns the existing `useTeacherClassroom`, `useClassRoster`, `useAssignments`, and `useTeacherReportsOverview("30d")` queries.
- `TeacherAttentionRail` accepts the existing `TeacherSingleClassroomReportPayload["attentionStudents"]` rows and `onViewStudent(studentId: string): void`.
- `TeacherClassroomSnapshot` accepts `TeacherSingleClassroomReportPayload["classroomSummary"]` plus roster/assignment counts.
- `TeacherRecentActivity` accepts `TeacherSingleClassroomReportPayload["recentActivity"]` and renders only supplied rows.

- [ ] **Step 1: Write source-contract tests for Today states and actions.**

```ts
import { assertStringIncludes } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherToday.tsx", import.meta.url));
const attention = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherAttentionRail.tsx", import.meta.url));

Deno.test("Today owns attention-first classroom actions", () => {
  for (const required of [
    "useTeacherClassroom",
    "useClassRoster",
    "useAssignments",
    "useTeacherReportsOverview",
    "Add students",
    "Assign quiz",
    "Retry",
    "No students need attention",
  ]) assertStringIncludes(source, required);
});

Deno.test("attention rail uses direct student actions", () => {
  for (const required of ["attentionStudents", "View student", "reasonCodes", "aria-label"]) {
    assertStringIncludes(attention, required);
  }
});
```

- [ ] **Step 2: Run the new test to verify it fails because the Today components do not exist.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/components/teacher-today.test.ts`

Expected: FAIL with file-not-found errors for the new Today components.

- [ ] **Step 3: Implement the Today components with real-data-only states.**

Use the existing `TeacherSingleClassroomReportPayload` types and `buildTeacherAssignedQuizzes` only when a count or assignment summary is needed. Show loading content before rendering dependent sections, a literal “Classroom unavailable” state when no classroom exists, and an error section with the query error message plus a `refetch`-backed Retry button. The no-attention state must render no fabricated names or scores.

Each attention row should translate existing reason codes to plain labels such as “Low average score”, “Has not started”, or “Low completion”, then expose one `View student` action. The learning trail is a CSS border/pseudo-element on the Today content, not an extra data source.

- [ ] **Step 4: Run the Today component test.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/components/teacher-today.test.ts`

Expected: PASS with the attention-first composition and explicit state/action contracts.

- [ ] **Step 5: Commit Today composition.**

```powershell
git add src/components/teacher/TeacherToday.tsx src/components/teacher/TeacherAttentionRail.tsx src/components/teacher/TeacherClassroomSnapshot.tsx src/components/teacher/TeacherRecentActivity.tsx test/src/components/teacher-today.test.ts
git commit -m "feat: add teacher today dashboard"
```

## Task 3: Route ownership and page decomposition

**Files:**
- Modify: `src/pages/teacher.tsx`
- Modify: `src/App.tsx`
- Modify: `test/src/pages/teacher-assignment.test.ts`
- Create: `test/src/pages/teacher-dashboard.test.ts`

**Interfaces:**
- Export `TeacherTodayPage`, `TeacherStudentsPage`, `TeacherAssignmentsPage`, `TeacherReportsPage`, and `TeacherSettingsPage` from `src/pages/teacher.tsx`.
- Preserve the existing exported aliases `TeacherWorkspacePage`, `TeacherClassesHome`, `TeacherReportsOverviewPage`, and `TeacherReportsPlaceholder` when they are still imported by tests or code; aliases must point to the canonical page instead of duplicating markup.
- `TeacherStudentsPage` owns `TeacherAddStudentsDialog`, roster/progress tables, removal confirmation, and `viewStudentAccount`.
- `TeacherAssignmentsPage` owns `TeacherAssignQuizDialog`, `TeacherAssignedQuizzes`, `useAssignments`, error, and retry.
- `TeacherReportsPage` remains the sole owner of report window state and report modules.

- [ ] **Step 1: Add route-ownership tests before changing routes.**

```ts
import { assertStringIncludes, assertEquals } from "jsr:@std/assert";

const page = await Deno.readTextFile(new URL("../../../src/pages/teacher.tsx", import.meta.url));
const app = await Deno.readTextFile(new URL("../../../src/App.tsx", import.meta.url));

Deno.test("teacher pages expose one owner per feature", () => {
  for (const required of ["TeacherTodayPage", "TeacherStudentsPage", "TeacherAssignmentsPage", "TeacherReportsPage", "TeacherSettingsPage"]) {
    assertStringIncludes(page, required);
  }
  assertEquals((page.match(/TeacherAddStudentsDialog/g) ?? []).length > 0, true);
  assertEquals((page.match(/TeacherAssignQuizDialog/g) ?? []).length > 0, true);
});

Deno.test("App routes canonical teacher destinations and legacy redirects", () => {
  for (const required of [
    'path="/teacher/students"',
    'path="/teacher/assignments"',
    'path="/teacher/reports"',
    'path="/teacher/settings"',
    'path="/teacher/classes"',
    'path="/teacher/classes/:classId"',
  ]) assertStringIncludes(app, required);
});
```

- [ ] **Step 2: Run the route tests to verify they fail against the current page structure.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/pages/teacher-assignment.test.ts test/src/pages/teacher-dashboard.test.ts`

Expected: FAIL because the current page owns classroom tabs in one component and App does not expose Students/Assignments routes.

- [ ] **Step 3: Split `src/pages/teacher.tsx` by canonical route without changing hooks or mutations.**

Move the existing classroom logic into `TeacherStudentsPage`; move assignment logic into `TeacherAssignmentsPage`; make `TeacherTodayPage` render `TeacherToday`; keep report content in `TeacherReportsPage`; replace the current Settings message with an existing-auth/session settings view. Keep dialogs and confirmation behavior intact. Route attention actions to Students and report actions to Reports with `useLocation`.

- [ ] **Step 4: Update `src/App.tsx` routes.**

Use `AppLayout sidebarMode="hidden"` consistently for the teacher shell. Add `/teacher/students` and `/teacher/assignments`, make `/teacher` render `TeacherTodayPage`, and redirect legacy class routes to `/teacher/students`. Keep `/teacher/reports/classes/:classId` redirecting to `/teacher/reports`.

- [ ] **Step 5: Run the route and assignment tests.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/pages/teacher-assignment.test.ts test/src/pages/teacher-dashboard.test.ts`

Expected: PASS, with assignment dialog ownership and route coverage preserved.

- [ ] **Step 6: Commit route decomposition.**

```powershell
git add src/pages/teacher.tsx src/App.tsx test/src/pages/teacher-assignment.test.ts test/src/pages/teacher-dashboard.test.ts
git commit -m "feat: split teacher dashboard sections"
```

## Task 4: Students and Assignments visual migration

**Files:**
- Modify: `src/components/teacher/TeacherStudentListTable.tsx`
- Modify: `src/components/teacher/TeacherStudentProgressTable.tsx`
- Modify: `src/components/teacher/TeacherAssignedQuizzes.tsx`
- Modify: `src/components/teacher/TeacherAssignQuizDialog.tsx`
- Modify: `src/components/teacher/add-students/*.tsx`
- Modify: `src/components/teacher/TeacherAssignedQuizPdfButton.tsx`
- Modify: `test/src/components/teacher-student-list-table.test.ts`
- Modify: `test/src/components/teacher-student-progress-table.test.ts`
- Modify: `test/src/components/teacher-assigned-quizzes.test.ts`

**Interfaces:**
- Keep table props `students: TeacherClassStudent[]`, `onRemove`, `onView`, and `viewingStudentId` compatible with `TeacherStudentsPage`.
- Keep assignment props, nested score expansion, `TeacherAssignedQuizPdfButton`, and dialog form fields unchanged.

- [ ] **Step 1: Add visual/interaction assertions to the existing component tests.**

Assert that student tables keep `View student`, `Remove`, real empty states, semantic table headings, and visible action labels. Assert assignment components keep `View games`, `Try again`, `No quizzes have been assigned`, and `TeacherAssignedQuizPdfButton`.

- [ ] **Step 2: Run the focused component tests before styling changes.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/components/teacher-student-list-table.test.ts test/src/components/teacher-student-progress-table.test.ts test/src/components/teacher-assigned-quizzes.test.ts`

Expected: PASS on existing functionality.

- [ ] **Step 3: Apply the Organic MathVenture layout to Students and Assignments.**

Replace card-heavy wrappers with bordered flat sections, a clear page-level action row, larger tabular numerics, hairline separators, and mobile-safe horizontal table scrolling. Keep all ordinary action copy and all current data fields. Preserve dialog/drawer behavior, nested assignment game drill-down, retry error, and PDF actions.

- [ ] **Step 4: Re-run focused component tests and typecheck.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/components/teacher-student-list-table.test.ts test/src/components/teacher-student-progress-table.test.ts test/src/components/teacher-assigned-quizzes.test.ts`

Expected: PASS with no changed data contracts.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit Students and Assignments migration.**

```powershell
git add src/components/teacher/TeacherStudentListTable.tsx src/components/teacher/TeacherStudentProgressTable.tsx src/components/teacher/TeacherAssignedQuizzes.tsx src/components/teacher/TeacherAssignQuizDialog.tsx src/components/teacher/add-students src/components/teacher/TeacherAssignedQuizPdfButton.tsx test/src/components/teacher-student-list-table.test.ts test/src/components/teacher-student-progress-table.test.ts test/src/components/teacher-assigned-quizzes.test.ts
git commit -m "feat: refine teacher students and assignments"
```

## Task 5: Reports, Settings, and theme polish

**Files:**
- Modify: `src/components/teacher/reports/*.tsx`
- Modify: `src/index.css`
- Modify: `src/pages/teacher.tsx`
- Test: existing `test/src/lib/teacher/reports/*.test.ts` and `test/src/components/*teacher*.test.ts`

**Interfaces:**
- Keep all existing report component prop types and `TeacherReportsWindowKey` values unchanged.
- Keep `parseTeacherReportsWindow` and query-string navigation as the report window source of truth.
- `TeacherSettingsPage` uses `useAuth` and the existing `signOut` path only; it must not call a new API endpoint.

- [ ] **Step 1: Run the report test subset before visual migration.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/lib/teacher/reports test/src/lib/teacher/navigation.test.ts`

Expected: PASS, establishing report data behavior before CSS/component changes.

- [ ] **Step 2: Update report hierarchy and Settings without changing data behavior.**

Use the same flat section treatment, clear left-aligned headings, visible numeric values, and straightforward actions. Keep attention list, activity, student table, topic breakdown, and PDF export exactly available. Make Settings render real teacher identity and sign-out, plus a clear statement when no other preferences are available rather than fake toggles.

- [ ] **Step 3: Add teacher-scoped theme tokens and grain.**

Add CSS variables/classes under `.teacher-shell` or a dedicated teacher root so student/game pages retain their current styling. Define the sand/sage/moss/terracotta/ochre palette, Epilogue font usage, hairline separators, `font-variant-numeric: tabular-nums`, and a low-opacity grain pseudo-element. Add `@media (prefers-reduced-motion: reduce)` to disable learning-trail transitions.

- [ ] **Step 4: Run the report and visual source tests plus typecheck/build.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/lib/teacher/reports test/src/components/teacher-workspace-board.test.ts test/src/components/teacher-assigned-quizzes.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS with a production bundle that includes all teacher routes.

- [ ] **Step 5: Commit Reports, Settings, and theme polish.**

```powershell
git add src/components/teacher/reports src/index.css src/pages/teacher.tsx test/src/lib/teacher/reports test/src/components/teacher-workspace-board.test.ts test/src/components/teacher-assigned-quizzes.test.ts
git commit -m "feat: polish teacher reports and visual system"
```

## Task 6: Full verification and handoff

**Files:**
- Modify only files required by failing verification; do not alter unrelated worktree files.

- [ ] **Step 1: Run the focused teacher suite.**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/lib/teacher test/src/pages/teacher-assignment.test.ts test/src/pages/teacher-dashboard.test.ts test/src/components/teacher-workspace-board.test.ts test/src/components/teacher-today.test.ts test/src/components/teacher-student-list-table.test.ts test/src/components/teacher-student-progress-table.test.ts test/src/components/teacher-assigned-quizzes.test.ts`

Expected: PASS with no skipped or focused tests.

- [ ] **Step 2: Run the complete project test gate.**

Run: `npm test`

Expected: PASS with the full Deno test suite and no test integrity changes.

- [ ] **Step 3: Run typecheck and production build.**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

Run: `npm run build`

Expected: PASS with a fresh `dist/public` bundle.

- [ ] **Step 4: Inspect the final diff and worktree.**

Run: `git diff --check; git status --short; git diff HEAD~6..HEAD --stat`

Expected: no whitespace errors; only teacher dashboard files and the plan/spec commits are part of this work; unrelated pre-existing untracked files remain untouched.
