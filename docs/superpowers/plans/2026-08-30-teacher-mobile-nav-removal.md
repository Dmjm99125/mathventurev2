# Teacher Mobile Navigation Strip Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the duplicate teacher identity/navigation/logout rail below the `md` breakpoint while leaving page-specific actions and tablet/desktop behavior unchanged.

**Architecture:** Make one declarative Tailwind class-list change in `TeacherWorkspaceBoard`. The existing rail remains in the DOM for tablet and desktop, while `display: none` below `md` removes it from both the visual layout and accessibility tree; the existing top-nav hamburger remains the mobile navigation.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, existing Deno tests, Vite.

## Global Constraints

- Hide the teacher rail below the `md` breakpoint.
- Remove the mobile avatar, “Welcome, <name>” text, teacher navigation buttons, and logout control from the board.
- Keep the existing `TopNav` hamburger menu as the mobile teacher navigation.
- Keep page-specific actions such as `Assign Quiz`, `+ Add`, and `Export PDF` visible.
- Preserve the current tablet and desktop teacher rail unchanged.
- Make no changes to routes, data, APIs, or student-facing pages.
- No new drawer, menu state, or mobile navigation component.

---

### Task 1: Hide the teacher rail below `md`

**Files:**
- Modify: `src/components/teacher/TeacherWorkspaceBoard.tsx`

**Interfaces:**
- Consumes: the existing teacher rail contents, `TeacherWorkspaceBoard` props, and top-nav mobile menu.
- Produces: the same teacher rail at `md` and above, with no visible or accessible rail below `md`.

- [ ] **Step 1: Add responsive visibility to the existing `<aside>`**

Change only the opening `<aside>` class list from its current responsive flex layout to include `hidden md:flex`:

```tsx
<aside className="hidden min-w-0 flex-col border-b-2 border-border bg-[linear-gradient(180deg,#f4f7e9_0%,#eef5dc_100%)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5 md:flex lg:flex-col lg:flex-nowrap lg:items-stretch lg:border-b-0 lg:border-r-2 lg:p-6">
```

Do not remove the avatar, welcome text, navigation links, logout button, main content section, or page-specific action nodes. `hidden` applies below `md`; `md:flex` restores the existing flex rail at `md` and above.

- [ ] **Step 2: Run the typecheck**

Run: `npm.cmd run typecheck`

Expected: PASS with no TypeScript errors.

### Task 2: Verify scope and commit the implementation

**Files:**
- Verify: `src/components/teacher/TeacherWorkspaceBoard.tsx`
- Verify: `src/pages/teacher.tsx`
- Verify: `src/components/layout.tsx`

**Interfaces:**
- Consumes: the completed responsive visibility change.
- Produces: evidence that only the teacher board rail changed and that mobile navigation/actions remain intact.

- [ ] **Step 1: Run targeted teacher tests**

Run: `deno test --allow-read test/src/lib/teacher/navigation.test.ts test/src/pages/teacher-assignment.test.ts`

Expected: PASS with 3 tests and 0 failures.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: PASS and emit the Vite production bundle. Existing font-import ordering and chunk-size warnings may remain.

- [ ] **Step 3: Confirm the implementation scope statically**

Run: `rg -n "hidden.*md:flex|Assign Quiz|\+ Add|Export PDF|Menu|md:hidden" src/components/teacher/TeacherWorkspaceBoard.tsx src/pages/teacher.tsx src/components/layout.tsx`

Expected: the rail contains `hidden` and `md:flex`; page-specific actions remain in `teacher.tsx`; the existing `Menu` and `md:hidden` mobile navigation remain in `layout.tsx`.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/components/teacher/TeacherWorkspaceBoard.tsx
git commit -m "feat: hide teacher rail on mobile"
```

