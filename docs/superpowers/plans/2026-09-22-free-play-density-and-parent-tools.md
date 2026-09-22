# Free Play Density and Parent Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with inline execution and verification checkpoints.

**Goal:** Make the Free Play intro thinner and keep the offline library collapsed until a parent opens it.

**Architecture:** Keep the page composition and offline hook unchanged. Adjust only the intro card's spacing and wrap the existing offline panel content in an accessible native disclosure, preserving all existing status branches and actions.

**Tech Stack:** React, TypeScript, Tailwind utility classes, Deno source-contract tests, Vite.

## Global Constraints

- Preserve the existing Free Play visual language and topic chooser.
- Do not change offline download behavior or service-worker protocol.
- Keep the offline library collapsed by default.
- Preserve existing copy unless needed for the parent disclosure label.

---

### Task 1: Thin the intro and collapse parent tools

**Files:**
- Modify: `src/pages/free-play.tsx`
- Modify: `src/components/offline/FreePlayOfflinePanel.tsx`
- Test: `test/src/pages/free-play.test.ts`
- Test: `test/src/components/free-play-offline-panel.test.ts`

**Interfaces:**
- Consumes: Existing `FreePlayOfflinePanel`, `FREE_PLAY_TOPICS`, and `LegacyLessonMenu` interfaces.
- Produces: A thinner intro card and a collapsed `<details>` disclosure that contains the unchanged offline panel states.

- [ ] **Step 1: Write failing source-contract assertions**

  Assert that the Free Play page uses the reduced intro spacing and that the offline panel exposes a collapsed parent disclosure. Keep existing assertions for the Free Play copy and panel.

- [ ] **Step 2: Run the focused tests and confirm they fail**

  Run:

  ```powershell
  $denoBin = 'C:\Users\Adriaan M. Dimate\.deno\bin'; $env:Path = "$denoBin;$env:Path"; deno test --allow-read --allow-env --import-map=deno.json test/src/pages/free-play.test.ts test/src/components/free-play-offline-panel.test.ts
  ```

  Expected: the new spacing/disclosure assertions fail against the current markup.

- [ ] **Step 3: Make the minimal implementation**

  In `src/pages/free-play.tsx`, reduce only the intro card padding and icon size while retaining its existing text and topic menu. In `src/components/offline/FreePlayOfflinePanel.tsx`, keep the current hook and state branches but render the section as a closed-by-default `<details>` with a `<summary>` that identifies it as a parent option.

- [ ] **Step 4: Run focused tests and the typecheck**

  Run the focused test command above, then:

  ```powershell
  npm run typecheck
  ```

  Expected: all focused tests pass and TypeScript exits with code 0.

- [ ] **Step 5: Run the production build**

  Run:

  ```powershell
  npm run build
  ```

  Expected: Vite and the PWA worker build complete successfully.

- [ ] **Step 6: Commit the implementation**

  ```powershell
  git add src/pages/free-play.tsx src/components/offline/FreePlayOfflinePanel.tsx test/src/pages/free-play.test.ts test/src/components/free-play-offline-panel.test.ts
  git commit -m "feat: simplify free play landing layout"
  ```
