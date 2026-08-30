# Teacher Dashboard Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the teacher classroom, reports, and settings surfaces usable on 320–430px phones and tablets while preserving the existing desktop classroom-board layout.

**Architecture:** Update the shared `TeacherWorkspaceBoard` responsively so all teacher pages inherit consistent spacing, navigation, and heading/action behavior. Keep dense student and report tables as tables inside intentional horizontal-scroll containers; do not add route, API, or data-model changes. Reuse the existing top-nav compact menu rather than introducing a second mobile drawer.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 utility classes, Wouter, Lucide icons, existing Deno test suite, Vite production build.

## Global Constraints

- Support phone widths around 320–430px and tablet widths from approximately 768px upward.
- Preserve the existing two-column teacher board on desktop.
- Prevent page-level horizontal overflow.
- Preserve dense table columns through intentional horizontal scrolling.
- Keep the two class-workspace tabs usable at narrow widths.
- No backend, database, API, route, or student-facing page changes.
- No conversion of tables into cards on mobile.
- Preserve semantic navigation, visible focus states, accessible names, and existing `aria-expanded`/`aria-controls` behavior.
- Keep the existing top-nav hamburger-style menu as the compact navigation fallback.

---

### Task 1: Make the shared teacher board responsive

**Files:**
- Modify: `src/components/teacher/TeacherWorkspaceBoard.tsx`

**Interfaces:**
- Consumes: existing `heading`, `action`, and `children` React nodes; existing teacher auth, language, and navigation hooks.
- Produces: a shared teacher shell that uses a desktop left rail at `lg` and a compact top rail below `lg` without changing navigation behavior.

- [ ] **Step 1: Update the board overflow and responsive grid classes**

Change the outer board to hide only viewport-level overflow, keep the content column shrinkable, and retain the existing two-column grid at `lg`:

```tsx
<div className="w-full min-h-[calc(100dvh-4rem)] overflow-x-hidden">
  <div className="min-h-[calc(100dvh-4rem)] overflow-hidden border-y-2 border-border bg-card shadow-[0_24px_70px_rgba(58,88,42,0.12)] sm:rounded-[32px] sm:border-2">
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
```

- [ ] **Step 2: Make the teacher identity and navigation compact below desktop**

Use a compact identity row, a horizontally scrollable navigation row, and shrinkable navigation links while retaining the existing `lg` vertical rail:

```tsx
<aside className="flex min-w-0 flex-col border-b-2 border-border bg-[linear-gradient(180deg,#f4f7e9_0%,#eef5dc_100%)] p-4 sm:p-5 lg:border-b-0 lg:border-r-2 lg:p-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:block">
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-white text-2xl font-display font-bold text-primary sm:h-16 sm:w-16 lg:h-24 lg:w-24 lg:rounded-[28px] lg:text-3xl">
      {user?.full_name?.trim().slice(0, 1).toUpperCase() ?? 'T'}
    </div>
    <p className="text-base font-display font-bold text-foreground sm:text-lg lg:mt-4">
      Welcome, {user?.full_name ?? 'Teacher'}
    </p>
  </div>

  <nav aria-label="Teacher navigation" className="mt-3 flex min-w-0 gap-2 overflow-x-auto pb-1 lg:mt-8 lg:grid lg:overflow-visible">
    {TEACHER_NAV_ITEMS.map((item) => (
      <Link key={item.href} href={item.href} className="shrink-0">
        <div className={cn('rounded-2xl px-4 py-3 font-bold transition-colors', ...)}>
          {t(item.labelKey)}
        </div>
      </Link>
    ))}
  </nav>
```

The active-state expression remains exactly as it is today. The `shrink-0` link class prevents labels from collapsing, while `overflow-x-auto` keeps the rail from widening the viewport.

- [ ] **Step 3: Reflow logout and the content panel**

Use a compact tablet logout area and restore the full vertical rail treatment at `lg`. Make the content column shrinkable and reduce its base padding:

```tsx
<div className="mt-4 border-t-2 border-border pt-4 sm:ml-auto sm:mt-0 sm:border-l-2 sm:border-t-0 sm:pl-4 lg:ml-0 lg:mt-8 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-6">
  <Button variant="ghost" className="w-full justify-start" onClick={...}>
    {t('common.logout')}
  </Button>
</div>

<section className="min-w-0 p-4 sm:p-5 md:p-6 lg:p-8">
  <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
    <div className="min-w-0">{heading}</div>
    {action ? <div className="w-full md:w-auto md:shrink-0">{action}</div> : null}
  </div>
  <div className="mt-6 min-w-0 sm:mt-8">{children}</div>
</section>
```

- [ ] **Step 4: Run the typecheck for the shell-only change**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit the shell change**

```bash
git add src/components/teacher/TeacherWorkspaceBoard.tsx
git commit -m "feat: make teacher workspace shell responsive"
```

### Task 2: Make teacher page headers, actions, and tabs mobile-safe

**Files:**
- Modify: `src/pages/teacher.tsx`

**Interfaces:**
- Consumes: existing teacher page state, dialogs, report data, and navigation.
- Produces: unchanged page behavior with responsive typography, wrapping actions, and usable class-workspace tabs.

- [ ] **Step 1: Scale the classroom, reports, and settings headings**

Update each page heading from `text-4xl` to `text-3xl sm:text-4xl`. Add a compact text size to descriptive copy where it appears beside the heading:

```tsx
<h1 className="text-3xl font-display font-bold sm:text-4xl">Classroom</h1>
<p className="mt-2 text-sm font-bold text-muted-foreground sm:text-base">
  Manage your students and monitor progress in one place.
</p>
```

Apply the same heading sizing to `Reports` and `Settings` without changing their strings.

- [ ] **Step 2: Make classroom action buttons fit narrow screens**

Use a full-width action group on phones and allow each button to grow evenly until `sm`:

```tsx
action={(
  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
    <Button className="w-full sm:w-auto" variant="jungle" onClick={() => setIsAssignQuizOpen(true)}>
      Assign Quiz
    </Button>
    <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsAddStudentsOpen(true)}>
      + Add
    </Button>
  </div>
)}
```

Give the reports PDF action the same `w-full sm:w-auto` wrapper behavior through the `action` node passed to `TeacherWorkspaceBoard`.

- [ ] **Step 3: Keep the class tabs within the viewport**

Replace the tab wrapper with a shrinkable, scrollable control strip and prevent button labels from wrapping or collapsing:

```tsx
<div className="mb-5 flex max-w-full overflow-x-auto rounded-2xl border-2 border-border bg-white p-1">
  <Button className="shrink-0" ...>Student List</Button>
  <Button className="shrink-0" ...>Student Progress</Button>
</div>
```

Keep the active-tab state and button variants unchanged.

- [ ] **Step 4: Run typecheck and the relevant teacher tests**

Run: `npm run typecheck`

Expected: PASS with the existing page props and state unchanged.

Run: `deno test test/src/lib/teacher/navigation.test.ts test/src/lib/teacher/progress.test.ts test/src/pages/teacher-assignment.test.ts`

Expected: PASS; responsive class changes must not alter navigation, progress, or assignment behavior.

- [ ] **Step 5: Commit the page-level responsive change**

```bash
git add src/pages/teacher.tsx
git commit -m "feat: optimize teacher page controls for mobile"
```

### Task 3: Optimize student tables for narrow widths

**Files:**
- Modify: `src/components/teacher/TeacherStudentListTable.tsx`
- Modify: `src/components/teacher/TeacherStudentProgressTable.tsx`

**Interfaces:**
- Consumes: existing student rows, progress values, and callbacks.
- Produces: unchanged table data and interactions with readable touch targets and bounded horizontal scrolling.

- [ ] **Step 1: Bound the student-list table scroll region**

Update the wrapper and table classes so the table scrolls within its rounded container and the action column stays usable:

```tsx
<div className="min-w-0 overflow-x-auto rounded-[24px] border-2 border-border bg-white">
  <table className="min-w-[640px] w-full border-collapse text-left">
```

Add `whitespace-nowrap` to the four header cells and the date/action cells as needed. Keep the empty-state row, `Remove` callback, and confirmation dialog behavior unchanged.

- [ ] **Step 2: Bound the progress table and expanded details**

Use a wider minimum table width for its six columns and keep the expanded details content shrinkable:

```tsx
<div className="min-w-0 overflow-x-auto rounded-[24px] border-2 border-border bg-white">
  <table className="min-w-[980px] w-full border-collapse text-left">
```

Apply `whitespace-nowrap` to column headings, keep the game-score button at a comfortable touch size, and add `min-w-0` to the expanded details wrapper. Preserve `aria-expanded`, `aria-controls`, the game catalog mapping, and the existing score formatting.

- [ ] **Step 3: Run the teacher progress and type tests**

Run: `deno test test/src/lib/teacher/progress.test.ts test/src/pages/teacher-assignment.test.ts`

Expected: PASS with no data or callback behavior changes.

Run: `npm run typecheck`

Expected: PASS with all table and card props unchanged.

- [ ] **Step 4: Commit the table responsive change**

```bash
git add src/components/teacher/TeacherStudentListTable.tsx src/components/teacher/TeacherStudentProgressTable.tsx
git commit -m "feat: make teacher student tables mobile friendly"
```

### Task 4: Finish responsive report tables and controls

**Files:**
- Modify: `src/components/teacher/reports/TeacherClassReportStudentTable.tsx`
- Modify: `src/components/teacher/reports/TeacherReportsClassComparison.tsx`
- Modify: `src/components/teacher/reports/TeacherReportsWindowPicker.tsx`

**Interfaces:**
- Consumes: existing report rows, window values, callbacks, and table actions.
- Produces: unchanged report behavior with readable dense tables and controls on phone/tablet widths.

- [ ] **Step 1: Add minimum widths to report tables**

Keep the existing `overflow-x-auto` wrappers and add table minimum widths:

```tsx
<table className="min-w-[760px] w-full border-collapse text-left">
```

Use `min-w-[900px]` for the class-comparison table because it contains seven columns. Add `whitespace-nowrap` to metric/date/action headers and cells where wrapping would make scanning harder.

- [ ] **Step 2: Make report window controls fill only when needed**

Keep the picker wrapping behavior but add `min-w-0` and ensure each control can remain a comfortable touch target without forcing viewport width:

```tsx
<div className="mb-6 flex min-w-0 flex-wrap gap-2">
```

Do not change the selected window values or route query behavior.

- [ ] **Step 3: Run report tests and typecheck**

Run: `deno test test/src/lib/teacher/reports/page-state.test.ts test/src/lib/teacher/reports/index.test.ts test/src/lib/teacher/reports/pdf.test.ts`

Expected: PASS with report calculations, window parsing, and PDF behavior unchanged.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 4: Commit the report responsive change**

```bash
git add src/components/teacher/reports/TeacherClassReportStudentTable.tsx src/components/teacher/reports/TeacherReportsClassComparison.tsx src/components/teacher/reports/TeacherReportsWindowPicker.tsx
git commit -m "feat: improve teacher reports on small screens"
```

### Task 5: Verify the complete teacher area at target viewports

**Files:**
- Verify: `src/components/teacher/TeacherWorkspaceBoard.tsx`
- Verify: `src/pages/teacher.tsx`
- Verify: `src/components/teacher/TeacherStudentListTable.tsx`
- Verify: `src/components/teacher/TeacherStudentProgressTable.tsx`
- Verify: `src/components/teacher/reports/TeacherClassReportStudentTable.tsx`
- Verify: `src/components/teacher/reports/TeacherReportsClassComparison.tsx`

**Interfaces:**
- Consumes: the completed responsive frontend changes.
- Produces: verified teacher pages with no regressions in data, navigation, or accessibility behavior.

- [ ] **Step 1: Run the complete automated checks**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS and emit the Vite production bundle.

Run: `npm test`

Expected: PASS for the existing Deno test suite.

- [ ] **Step 2: Run the local app for manual viewport verification**

Run: `npm run dev -- --host 0.0.0.0`

Open the teacher routes with an authenticated teacher session and inspect at approximately 320px, 390px, 768px, and 1024px widths.

- [ ] **Step 3: Verify the classroom page**

At each target width, confirm:

1. The teacher identity and navigation remain reachable.
2. The existing top-nav hamburger menu remains usable on small screens.
3. Headings, `Assign Quiz`, and `+ Add` do not clip or overlap.
4. Tabs remain visible and usable.
5. Student tables scroll horizontally inside their containers, without page-level horizontal overflow.
6. Remove and expanded-game controls retain visible focus and comfortable touch targets.

- [ ] **Step 4: Verify reports, settings, and dialogs**

Confirm reports cards, window picker, report tables, PDF action, and settings placeholder inherit the shared mobile spacing. Open the existing add-students drawer and assign-quiz dialog on a phone width and confirm their controls remain reachable; do not alter their data behavior.

- [ ] **Step 5: Commit the verified final state**

```bash
git add src/components/teacher src/pages/teacher.tsx
git commit -m "feat: make teacher dashboard mobile friendly"
```
