# About Researchers Repository Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single repository action in the About The Researchers page with a Papers-style menu containing separate Legacy and Current repository links.

**Architecture:** Keep the existing top-right action bar and Radix dropdown pattern in `frontend/src/pages/about.tsx`. The menu will use two external anchors with the existing GitHub icon treatment, opening in new tabs; no routing, backend, Netlify, or dependency changes are needed.

**Tech Stack:** React, TypeScript, `lucide-react`, Radix UI dropdown menu, Deno source-level tests, Vite.

## Global Constraints

- Preserve the existing Papers dropdown and About The Researchers layout.
- Legacy repository URL: `https://github.com/dmjm99125/mathventureprototype`.
- Current repository URL: `https://github.com/dmjm99125/mathventurev2`.
- Keep external links opening with `target="_blank"` and `rel="noopener noreferrer"`.
- Do not change Supabase/backend files or Netlify configuration.
- Do not weaken or skip existing tests.

---

### Task 1: Add the repository-menu regression test

**Files:**
- Create: `frontend/test/src/pages/about.test.ts`

**Interfaces:**
- Consumes: `frontend/src/pages/about.tsx` as source text.
- Produces: A deterministic source-level test that proves both repository menu labels and exact URLs remain present.

- [x] **Step 1: Write the failing test**

```ts
import { assertEquals } from "jsr:@std/assert";

const aboutSource = await Deno.readTextFile(
  new URL("../../../src/pages/about.tsx", import.meta.url),
);

Deno.test("About The Researchers exposes legacy and current repository links", () => {
  assertEquals((aboutSource.match(/<span>(?:Legacy|Current)<\/span>/g) ?? []).length, 2);
  assertEquals(
    /<a href="https:\/\/github\.com\/dmjm99125\/mathventureprototype" target="_blank" rel="noopener noreferrer"/.test(aboutSource),
    true,
  );
  assertEquals(
    /<a href="https:\/\/github\.com\/dmjm99125\/mathventurev2" target="_blank" rel="noopener noreferrer"/.test(aboutSource),
    true,
  );
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run from the worktree root:

```powershell
deno test --allow-read --allow-env --import-map=frontend/deno.json frontend/test/src/pages/about.test.ts
```

Expected: FAIL because `about.tsx` currently contains one direct repository anchor and no Legacy/Current menu labels.

### Task 2: Replace the single Repo button with a two-link menu

**Files:**
- Modify: `frontend/src/pages/about.tsx` in the top-right action bar.

**Interfaces:**
- Consumes: The existing `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `Github`, and `Lock` imports.
- Produces: A `Repo` dropdown with two external links, one for each repository.

- [x] **Step 1: Replace the direct repository button**

Replace the existing direct repository button with:

```tsx
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 font-bold bg-white/70 backdrop-blur-md border-white/50 hover:bg-white/90">
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">Repo</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 font-bold">
              <DropdownMenuItem asChild>
                <a href="https://github.com/dmjm99125/mathventureprototype" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer w-full text-primary">
                  <Github className="w-4 h-4" />
                  <span>Legacy</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="https://github.com/dmjm99125/mathventurev2" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer w-full text-primary">
                  <Github className="w-4 h-4" />
                  <span>Current</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
```

- [x] **Step 2: Run the focused regression test**

Run:

```powershell
deno test --allow-read --allow-env --import-map=frontend/deno.json frontend/test/src/pages/about.test.ts
```

Expected: PASS with 1 test and 0 failures.

### Task 3: Verify the frontend and commit the isolated change

**Files:**
- Modify: `frontend/src/pages/about.tsx`
- Create: `frontend/test/src/pages/about.test.ts`
- Create: `docs/superpowers/plans/2026-09-22-about-repository-links.md`

**Interfaces:**
- Consumes: The completed About page menu and regression test.
- Produces: A committed, buildable feature branch ready to merge into `master`.

- [x] **Step 1: Run typecheck**

```powershell
npm run typecheck
```

Expected: exit code 0.

- [x] **Step 2: Run the production build**

```powershell
npm run build
```

Expected: exit code 0 and Vite writes the frontend production bundle.

- [x] **Step 3: Confirm only scoped files changed**

```powershell
git status --short
```

Expected: only the About page, its test, and this implementation plan are changed or untracked; existing unrelated worktree files are not modified.

- [x] **Step 4: Commit the feature**

```powershell
git add frontend/src/pages/about.tsx frontend/test/src/pages/about.test.ts docs/superpowers/plans/2026-09-22-about-repository-links.md
git commit -m "feat: add legacy and current repository links"
```

- [ ] **Step 5: Merge the feature branch into `master` after verification**

From the main checkout:

```powershell
git merge --no-ff codex/about-repo-links -m "Merge legacy and current repository links"
```

Expected: `master` contains the feature commit and no merge conflicts.

## Self-Review

- Spec coverage: the two requested repository destinations are represented as separate menu items, matching the existing Papers interaction.
- Placeholder scan: no TODO, TBD, or unspecified URLs remain.
- Type consistency: the test reads the existing source file and asserts the exact JSX labels and URLs introduced by Task 2.
