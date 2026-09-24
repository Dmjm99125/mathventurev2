# Index CSS Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the monolithic `frontend/src/index.css` into ordered CSS partials without changing any CSS values, selectors, class names, or rendered cascade behavior.

**Architecture:** Keep `frontend/src/index.css` as the stylesheet entrypoint imported by the existing application. It will retain the external font/Tailwind imports and import local partials in the same effective order as the current file. Foundation directives, student styles, teacher/landing component styles, researcher styles, and responsive overrides will each have one focused home.

**Tech Stack:** Vite 6, Tailwind CSS 4, CSS `@import`, CSS layers, React/Vite production build.

## Global Constraints

- Do not change any CSS value, selector, class name, media-query condition, animation, token, or declaration order within an existing style block.
- Preserve the existing `frontend/src/main` stylesheet wiring; no component class-name changes are allowed.
- Keep `frontend/src/index.css` as the public CSS entrypoint.
- Do not add dependencies or alter visual behavior.
- Leave unrelated working-tree files and untracked files untouched.

---

### Task 1: Capture the baseline stylesheet output

**Files:**
- Read: `frontend/src/index.css`
- Read: `frontend/vite.config.ts`
- Output: existing generated CSS under `frontend/dist/assets/`

**Interfaces:**
- Consumes: the current committed CSS entrypoint.
- Produces: a baseline production-build result used to confirm that the refactor does not alter generated CSS.

- [ ] **Step 1: Confirm the current stylesheet entrypoint and build command**

Run:

```powershell
rg -n "index\.css|import .*css" frontend/src frontend/vite.config.ts
npm run build
```

Expected: the application imports `frontend/src/index.css`, and Vite completes successfully.

- [ ] **Step 2: Record the generated entry CSS fingerprint**

Run:

```powershell
$css = Get-ChildItem frontend/dist/assets/index-*.css | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-FileHash -Algorithm SHA256 $css.FullName
```

Expected: one SHA256 fingerprint for the current generated CSS bundle.

### Task 2: Create the ordered stylesheet partials

**Files:**
- Create: `frontend/src/styles/foundation.css`
- Create: `frontend/src/styles/student.css`
- Create: `frontend/src/styles/teacher.css`
- Create: `frontend/src/styles/landing.css`
- Create: `frontend/src/styles/researchers.css`
- Create: `frontend/src/styles/responsive.css`

**Interfaces:**
- Consumes: the current blocks from `frontend/src/index.css`.
- Produces: focused partials with no new selectors or declarations.

- [ ] **Step 1: Move foundation directives without editing their values**

Move the existing `@plugin`, `@custom-variant`, `@theme inline`, `:root`, `.dark`, `@layer base`, and `@layer utilities` blocks into `foundation.css` in their existing order.

- [ ] **Step 2: Move student component styles as one component-layer block**

Move the `.student-*` rules and `student-loading-progress` keyframes into `student.css`, preserving the existing `@layer components` wrapper and rule order.

- [ ] **Step 3: Move teacher component styles as one component-layer block**

Move `.teacher-*` rules into `teacher.css`, preserving the existing `@layer components` wrapper and rule order.

- [ ] **Step 4: Move landing component styles as one component-layer block**

Move `.landing-*` rules and `landing-sparkle` keyframes into `landing.css`, preserving the existing `@layer components` wrapper and rule order.

- [ ] **Step 5: Move researcher styles without adding a layer**

Move the researcher rules from the `/* Researchers page */` marker through the researcher-specific `@media (max-width: 640px)` block into `researchers.css` without wrapping them in `@layer`, because they are currently unlayered.

- [ ] **Step 6: Move global responsive overrides last**

Move the existing reduced-motion, landing responsive, student responsive, and small-screen rules into `responsive.css` in their current order. Do not merge media queries or reorder rules.

### Task 3: Rewire the stylesheet entrypoint

**Files:**
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: the six local partials from Task 2.
- Produces: the same application stylesheet entrypoint with an explicit import order.

- [ ] **Step 1: Keep the external imports first**

Retain the existing font imports, `tailwindcss`, and `tw-animate-css` imports at the top of `index.css` without changing their values.

- [ ] **Step 2: Import local partials in source order**

Use this exact local order after the external imports:

```css
@import './styles/foundation.css';
@import './styles/student.css';
@import './styles/teacher.css';
@import './styles/landing.css';
@import './styles/researchers.css';
@import './styles/responsive.css';
```

No component or page file should be changed.

### Task 4: Verify value and cascade preservation

**Files:**
- Read: `frontend/src/index.css`
- Read: `frontend/src/styles/*.css`
- Verify: generated Vite CSS bundle

**Interfaces:**
- Consumes: the refactored stylesheet entrypoint and partials.
- Produces: a verified build with unchanged CSS output and no type regressions.

- [ ] **Step 1: Check source integrity**

Run:

```powershell
git diff --check
rg -n "TBD|FIXME" frontend/src/index.css frontend/src/styles
```

Expected: no whitespace errors and no placeholder text.

- [ ] **Step 2: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: TypeScript exits with code 0; no source components were changed.

- [ ] **Step 3: Build and compare the generated CSS fingerprint**

Run:

```powershell
npm run build
$css = Get-ChildItem frontend/dist/assets/index-*.css | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-FileHash -Algorithm SHA256 $css.FullName
```

Expected: Vite completes successfully and the generated CSS fingerprint matches the baseline from Task 1. If the fingerprint differs, inspect import/layer expansion and restore the original effective order before proceeding.

- [ ] **Step 4: Run the repository test command**

Run:

```powershell
npm test
```

Expected: the test command runs if Deno is available; otherwise report the existing environment blocker without changing the test configuration.

- [ ] **Step 5: Commit the refactor**

Run:

```powershell
git add frontend/src/index.css frontend/src/styles
git commit -m "refactor: split monolithic index stylesheet"
```

Expected: only the stylesheet entrypoint and its new partials are committed.
