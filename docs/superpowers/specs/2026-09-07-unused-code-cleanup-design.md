# Unused Code and Asset Cleanup Design

## Goal

Reduce MathVenture bloat by removing only files, dependencies, assets, and symbols that are proven unused by the application or are generated local artifacts, while preserving runtime behavior and live test coverage.

## Scope

The cleanup covers:

- Source files unreachable from `src/main.tsx`, excluding files used by Supabase edge-function entrypoints.
- Source files and generated data used only by tests when those tests describe functionality that is no longer part of the application.
- Private imports, locals, helpers, and declarations proven unused by TypeScript diagnostics and source cross-checks.
- Package dependencies with no remaining runtime, test, build, or configuration usage after source cleanup.
- Public assets with no reference from reachable runtime code, live tests, or application documentation.
- Tracked local caches and compiler artifacts that are not consumed by any project command.
- The unused Vite `@assets` alias that points outside the repository and currently blocks the production build.

The cleanup does not cover behavior changes, visual redesign, data migrations, or replacement of working application features.

## Preserved Material

The following remain untouched:

- `docs/legacy-prototype-reference/`, which is the project’s recovery/reference archive.
- `.codex/` recovery snapshots and `.agents/` project instructions.
- Existing project documentation, Supabase migrations, and deployed edge-function entrypoints.
- The user-created untracked `.tmp-shape-matching-build/` directory and any unrelated working-tree changes.
- Tests that cover reachable application or edge-function behavior.

## Audit Evidence

The read-only audit established these baselines:

- The repository contains 222 TypeScript/TSX source files; 163 are reachable from the frontend entrypoint.
- Fifty-nine frontend source files are not reachable from the frontend entrypoint. This set includes the three removed-from-gameplay number games, two unused teacher components, an unused toast helper, and unused UI primitives.
- `public/assets/` contains 447 files totaling approximately 284 MB. 132 files totaling approximately 44 MB have no basename reference in reachable runtime code, live tests, or application documentation.
- `.npm-cache/` is tracked and is approximately 321 MB of package-manager cache data. `tsconfig.tsbuildinfo` is a tracked compiler cache artifact.
- The package audit found five unreferenced runtime dependencies: `@hookform/resolvers`, `@tailwindcss/typography`, `date-fns`, `react-icons`, and `zod`. Type-only, compiler, and build-tool packages are retained unless they become unused after component cleanup.
- `npm run typecheck` passes at the baseline.
- The repository test command currently fails before execution because Deno lacks Vite `ImportMeta.env` typing. The permission-correct no-check suite reaches 275 passing tests and two pre-existing shape-data assertion failures.
- `npm run build` currently fails while resolving the unused external `@assets` alias in `vite.config.ts`.

## Design

### 1. Reachability-first deletion

Build and maintain a source reachability inventory from the frontend entrypoint, Supabase function entrypoints, and test imports. Delete only files outside those live graphs, or files whose only references are tests that are also removed because they validate deleted functionality. Re-run the inventory after each deletion batch so transitive dead UI files are removed only after their consumers are gone.

### 2. Symbol and dependency pruning

Use TypeScript’s strict unused diagnostics as a candidate list, then verify each candidate against JSX usage, dynamic references, exports, test source reads, and Supabase imports. Remove unused imports, locals, private helpers, and declarations in focused topic batches. Update `package.json` and the lockfile only for dependencies with no remaining usage.

### 3. Asset cross-checking

Remove only assets absent from the reachable runtime/test/documentation corpus. Dynamic asset patterns are reviewed by directory and filename family before deletion; assets referenced through generated paths remain when the family is live. The legacy prototype archive is not used as an application reference and is preserved separately as requested.

### 4. Build/config cleanup

Remove the unused `@assets` Vite alias and its now-unneeded configuration code. Do not alter routing, environment variables, Supabase configuration, migrations, or deployment output paths.

### 5. Verification and history

After each edit, run the smallest applicable check. Before completion, run typecheck, the permission-correct full Deno suite, and the production build, recording any unchanged baseline failures. The work will use at least 25 coherent commits grouped by cleanup concern: artifacts, generators/data, dead gameplay, dead teacher/UI components, symbols, dependencies, configuration, and asset families. No empty or purely mechanical commits will be created.

## Acceptance Criteria

- No preserved reference material or unrelated user changes are deleted.
- Every deleted source file has a reachability or usage finding supporting its removal.
- Every deleted asset has a cross-check showing no live reference.
- No live frontend or Supabase entrypoint imports a deleted module.
- No package remains in the manifest solely because of deleted code.
- TypeScript has no new errors.
- The full no-check Deno suite has no new failures beyond the two baseline shape-data failures, unless those baseline failures are independently repaired without changing application behavior.
- The production build completes after removing the unused external alias, or any remaining failure is explicitly identified as unrelated and reproducible.
- The final history contains at least 25 meaningful cleanup commits.
