# CI Pipeline Design

## Goal

Add a GitHub Actions continuous-integration quality gate for MathVenture. The first increment validates the existing frontend and Supabase test suites without deploying the application. Deployment remains a later phase.

## Scope

This increment creates one workflow at `.github/workflows/ci.yml`.

In scope:

- Run CI for pull requests targeting `master`.
- Run CI for pushes to `master`.
- Support manual `workflow_dispatch` runs.
- Run frontend typechecking, tests, and production build checks.
- Run the existing Supabase/Deno test suite.
- Keep frontend and Supabase checks as separate parallel jobs.
- Cancel superseded runs for the same branch or pull request.
- Keep workflow permissions read-only.

Out of scope:

- Netlify deployment.
- Supabase Edge Function or migration deployment.
- Production or hosted Supabase credentials.
- Local test execution as part of this task.
- Changes to application runtime behavior or existing test coverage.

## Architecture

The workflow contains two independent jobs:

1. `frontend` checks out the repository, installs the `frontend/` npm project from its lockfile, runs TypeScript typechecking, runs the complete frontend Deno suite, and creates the Vite production build.
2. `supabase` checks out the repository, installs Deno, and runs the complete root `test/supabase` suite using the repository's existing frontend Deno configuration and lockfile.

Both jobs run on GitHub-hosted Ubuntu runners and use the same source revision. They do not depend on each other, so failures identify the affected area directly. A future deployment job can depend on both jobs without changing these quality gates.

## Runtime and action versions

- Node.js `22`, an Active LTS line suitable for the existing Vite/TypeScript toolchain.
- Deno `2.x`, compatible with the repository's Deno lockfile format and existing tests.
- `actions/checkout@v7`.
- `actions/setup-node@v7` with npm caching based on `frontend/package-lock.json`.
- `denoland/setup-deno@v2`.

## Checks

The frontend job runs these commands in order:

```text
npm ci --prefix frontend
npm run typecheck --prefix frontend
timeout 110s npm test --prefix frontend
npm run build --prefix frontend
```

The Supabase job runs the complete test directory with the permissions required by the current tests:

```text
timeout 110s deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
```

No focused test filters, skipped tests, weakened assertions, or advisory failures are introduced. The bounded test commands fail if a suite hangs beyond 110 seconds.

## Events and concurrency

The workflow triggers on:

```yaml
pull_request:
  branches: [master]
push:
  branches: [master]
workflow_dispatch:
```

Concurrency is grouped by workflow name and the pull-request head reference when present, otherwise by the branch reference. Newer runs cancel older in-progress runs in the same group.

## Security

The workflow sets:

```yaml
permissions:
  contents: read
```

It uses `pull_request`, not `pull_request_target`, and requires no repository secrets. It does not start Supabase, connect to a hosted database, deploy artifacts, or grant write permissions.

## Failure handling and diagnostics

Each job uses a bounded job timeout. Commands run without failure suppression so the first failing command remains visible in the GitHub Actions log. The workflow does not upload build artifacts because this increment is a quality gate, not a deployment or artifact publication pipeline.

## Future extension

Deployment should be added as a separate job or workflow after this gate is established. Any deployment job should depend on successful `frontend` and `supabase` jobs and introduce only the credentials and permissions required by the selected deployment target.
