# Frontend Directory Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the complete browser application into `frontend/` while keeping `supabase/` at the repository root as the backend and preserving all development, test, build, and deployment workflows.

**Architecture:** `frontend/` becomes the Vite project root and owns React source, public assets, frontend tests, frontend scripts, dependencies, and frontend tooling configuration. `supabase/` remains the root backend boundary, with its tests remaining under root `test/supabase/`. Root documentation and repository metadata remain shared.

**Tech Stack:** React 19, TypeScript, Vite 6, Vite PWA, Tailwind CSS, Deno tests, Supabase.

## Global Constraints

- Preserve all existing test coverage and existing unrelated working-tree changes.
- Keep `supabase/` at the repository root and do not modify backend implementation behavior.
- Frontend commands run from `frontend/`.
- Do not delete existing generated directories or user files.
- Verify typecheck, frontend tests, production build, and backend tests before completion.

---

### Task 1: Relocate frontend-owned files

**Files:**
- Move: `src/` → `frontend/src/`
- Move: `public/` → `frontend/public/`
- Move: root frontend tests from `test/` → `frontend/test/`
- Preserve: `test/supabase/` at `test/supabase/`
- Move: `scripts/` → `frontend/scripts/`
- Move: `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `deno.json`, `components.json`, `netlify.toml` into `frontend/`
- Move: `parseLegacy.mjs` into `frontend/scripts/parseLegacy.mjs`
- Move: `.env` into `frontend/.env` if present, preserving its contents and ignored status.

**Interfaces:**
- Produces a self-contained frontend project rooted at `frontend/`.
- Leaves `supabase/` and `test/supabase/` outside the frontend tree.

- [ ] **Step 1: Create the destination and move tracked frontend files.**

  Use `git mv` for tracked paths so the relocation remains visible as renames. Split `test/` so only frontend tests move:

  ```powershell
  New-Item -ItemType Directory -Force frontend | Out-Null
  git mv src frontend/src
  git mv public frontend/public
  git mv scripts frontend/scripts
  git mv index.html package.json package-lock.json vite.config.ts tsconfig.json deno.json components.json netlify.toml frontend/
  git mv parseLegacy.mjs frontend/scripts/parseLegacy.mjs
  New-Item -ItemType Directory -Force frontend/test | Out-Null
  Get-ChildItem test -Force | Where-Object { $_.Name -ne 'supabase' } | ForEach-Object { git mv $_.FullName frontend/test/ }
  ```

- [ ] **Step 2: Move the local frontend environment file without staging it.**

  ```powershell
  if (Test-Path .env) { Move-Item -LiteralPath .env -Destination frontend/.env }
  ```

- [ ] **Step 3: Inspect the resulting tree and git status.**

  Run `Get-ChildItem frontend -Force -Recurse` and `git status --short`. Confirm the frontend source, assets, tests, scripts, manifest, and configs are under `frontend/`, while `supabase/` and `test/supabase/` remain in place.

### Task 2: Repoint frontend tooling to the new root

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.json`
- Modify: `frontend/deno.json`
- Modify: `frontend/index.html`
- Modify: `frontend/components.json`
- Modify: `frontend/netlify.toml`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json` only if package metadata or lockfile normalization requires it.

**Interfaces:**
- Vite resolves source, public assets, PWA service worker, environment variables, and generated manifest relative to `frontend/`.
- `@/*` resolves to `frontend/src/*`.
- Frontend npm scripts execute correctly from `frontend/`.

- [ ] **Step 1: Update Vite paths.**

  In `frontend/vite.config.ts`, resolve the media manifest source from `path.resolve(import.meta.dirname, 'public/assets')`, keep `root` at `path.resolve(import.meta.dirname)`, resolve `@` to `path.resolve(import.meta.dirname, 'src')`, set the build output to `path.resolve(import.meta.dirname, 'dist')`, and keep `srcDir: 'src/pwa'`.

- [ ] **Step 2: Update TypeScript and Deno aliases.**

  Change the TypeScript path mapping to `"@/*": ["./src/*"]` in the relocated config, and keep the Deno import map as `"@/": "./src/"`; these paths are now relative to `frontend/`.

- [ ] **Step 3: Update HTML, component, and hosting paths.**

  Keep the HTML module entry as `/src/main.tsx` because Vite serves from the new frontend root. Keep `components.json` CSS and aliases relative to `src`. Change Netlify publish output to `dist` because `frontend/netlify.toml` is now inside the frontend project.

- [ ] **Step 4: Keep frontend package scripts self-contained.**

  Keep `dev`, `build`, `serve`, and `typecheck` commands using the relocated config filenames. Change the test command to run `test` from the frontend working directory. Preserve dependency versions and existing test permissions.

- [ ] **Step 5: Run a path audit.**

  From the repository root, run `rg -n --glob '!node_modules/**' --glob '!.git/**' --glob '!dist/**' --glob '!dev-dist/**' '(path\.resolve\(.*src|path\.resolve\(.*public|srcDir|outDir|publish|src/main\.tsx|\"@/\")' frontend`. Confirm every result points to paths valid under `frontend/`.

### Task 3: Preserve test execution after relocation

**Files:**
- Modify: frontend test files only if their working-directory or import paths require correction.
- Modify: `README.md` with the new commands.

**Interfaces:**
- `npm test` from `frontend/` runs all frontend tests.
- Root backend tests remain runnable with the Deno command using the frontend import map where needed.

- [ ] **Step 1: Run the frontend test suite from its project root.**

  Run `npm test` from `frontend/`. If a failure is caused by a stale root-relative path, update only that path to its equivalent under the relocated tree and rerun the failing test.

- [ ] **Step 2: Verify the backend test lane independently.**

  Run `deno test --allow-read --allow-env --import-map=frontend/deno.json test/supabase`. Do not move or weaken backend tests to accommodate the frontend relocation.

- [ ] **Step 3: Update README setup and repository structure.**

  Document `cd frontend` before `npm install`, `npm run dev`, `npm run build`, and `npm test`; show `frontend/` and `supabase/` as the application boundaries; keep Supabase commands documented as root-level backend commands or direct Supabase CLI commands.

### Task 4: Run the complete local quality gate

**Files:**
- Modify: none unless a verification command identifies a required path correction.

- [ ] **Step 1: Run frontend typecheck.**

  From `frontend/`, run `npm run typecheck`. Expected result: exit code 0 with no TypeScript errors.

- [ ] **Step 2: Run the complete frontend tests.**

  From `frontend/`, run `npm test`. Expected result: exit code 0 and all existing frontend tests pass.

- [ ] **Step 3: Run the production build.**

  From `frontend/`, run `npm run build`. Expected result: exit code 0 and a production bundle is created under `frontend/dist/`.

- [ ] **Step 4: Re-run backend tests after the frontend build.**

  From the repository root, run `deno test --allow-read --allow-env --import-map=frontend/deno.json test/supabase`. Expected result: exit code 0.

- [ ] **Step 5: Inspect the final diff and layout.**

  Run `git diff --stat`, `git diff -- frontend`, `git status --short`, and a final `rg --files -g '!node_modules/**' -g '!dist/**' -g '!dev-dist/**' | Sort-Object`. Confirm no frontend source, public assets, frontend tests, package manifest, or frontend build configuration remains at the root.
