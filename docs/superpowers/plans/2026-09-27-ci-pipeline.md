# CI Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions CI quality gate that validates the frontend and Supabase test suites without deploying anything.

**Architecture:** Add one `.github/workflows/ci.yml` workflow with independent `frontend` and `supabase` jobs. The frontend job uses the locked npm project and existing scripts; the Supabase job uses Deno with the repository's existing configuration and lockfile. Both jobs run on pull requests to `master`, pushes to `master`, and manual dispatches.

**Tech Stack:** GitHub Actions, Ubuntu runners, Node.js 22, npm, Deno 2.x, TypeScript, Vite, and the repository's existing Deno test suites.

## Global Constraints

- Do not run tests, builds, dependency installation, or other heavy verification locally during this task because the user has limited RAM and is using the laptop for church ProPresenter.
- Do not change application runtime behavior or existing test coverage.
- Do not add deployment, production credentials, Supabase services, migrations, or Netlify actions.
- Run the complete existing test suites; do not use focused filters, skipped tests, weakened assertions, swallowed failures, or advisory failures.
- Keep the frontend and Supabase checks as separate parallel jobs.
- Use read-only GitHub Actions permissions: `contents: read`.
- Bound each test command with `timeout 110s` and each job with a finite `timeout-minutes` value.
- Preserve unrelated changes in the dirty parent checkout; work only in the isolated `codex-ci-pipeline` worktree.

---

### Task 1: Add the GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`
- Reference: `frontend/package.json` for the existing `typecheck`, `test`, and `build` scripts
- Reference: `frontend/package-lock.json` for npm caching and deterministic installation
- Reference: `frontend/deno.json` and `frontend/deno.lock` for Supabase test configuration and dependency locking
- Reference: `test/supabase/` for the complete backend test directory

**Interfaces:**
- Consumes: the repository's existing frontend npm scripts and Deno test files.
- Produces: two GitHub Actions checks named `Frontend checks` and `Supabase tests` for pull requests, pushes to `master`, and manual workflow dispatches.

- [ ] **Step 1: Create the workflow directory and workflow file**

Create `.github/workflows/ci.yml` with exactly this structure:

```yaml
name: CI

on:
  pull_request:
    branches:
      - master
  push:
    branches:
      - master
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  frontend:
    name: Frontend checks
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Check out repository
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend dependencies
        run: npm ci --prefix frontend

      - name: Typecheck frontend
        run: npm run typecheck --prefix frontend

      - name: Test frontend
        run: timeout 110s npm test --prefix frontend

      - name: Build frontend
        run: npm run build --prefix frontend

  supabase:
    name: Supabase tests
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Check out repository
        uses: actions/checkout@v7

      - name: Set up Deno
        uses: denoland/setup-deno@v2
        with:
          deno-version: 2.x

      - name: Test Supabase functions
        run: >-
          timeout 110s deno test
          --allow-env
          --allow-read
          --config frontend/deno.json
          --lock=frontend/deno.lock
          --frozen
          test/supabase
```

- [ ] **Step 2: Review the workflow for scope and required gates**

Confirm the new file has exactly one workflow and two jobs. Confirm the frontend job runs install, typecheck, the complete `npm test` script, and build. Confirm the Supabase job targets `test/supabase` without a test filter. Confirm no deployment action, secret, write permission, `pull_request_target`, `continue-on-error`, `if: always()`, `skip`, or focused test selector was added.

- [ ] **Step 3: Perform lightweight local static checks only**

Because local tests and builds are explicitly prohibited for this task, run only these non-heavy checks from the isolated worktree:

```powershell
git diff --check
git status --short
Get-Content -Raw .github/workflows/ci.yml
```

Expected output:

- `git diff --check` exits successfully with no whitespace errors.
- `git status --short` lists only `.github/workflows/ci.yml` as an implementation change, plus any plan-tracking state created by the worker.
- The workflow contents match Step 1 and contain no local-only paths or secrets.

- [ ] **Step 4: Commit the workflow**

```powershell
git add .github/workflows/ci.yml
git commit -m "ci: add frontend and Supabase quality gates"
```

Expected output: a new commit containing only the CI workflow, with no changes to application code, tests, dependencies, or deployment configuration.

### Task 2: Verify the CI gate remotely

**Files:**
- Reference: `.github/workflows/ci.yml`
- Modify: none

**Interfaces:**
- Consumes: the committed CI workflow from Task 1.
- Produces: GitHub Actions results for both `Frontend checks` and `Supabase tests`.

- [ ] **Step 1: Push or open the branch for remote execution**

Use the repository's normal review/push flow to make the `codex-ci-pipeline` branch available to GitHub Actions. Do not run the test commands locally.

- [ ] **Step 2: Inspect the Actions run**

Confirm GitHub Actions starts both jobs for the same commit and that the logs show the intended commands. Confirm the frontend run uses `frontend/package-lock.json` and the Supabase run uses `frontend/deno.lock`.

- [ ] **Step 3: Record the actual remote result**

If both jobs exit successfully, report the run URL and the two successful job names. If either job fails, report its first failing command and log error without weakening the workflow or claiming completion. If GitHub access or credentials are unavailable, report remote CI as unverified.
