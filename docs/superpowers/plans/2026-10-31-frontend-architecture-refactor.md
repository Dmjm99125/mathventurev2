# MathVenture Frontend Architecture Refactor

## Objective

Refactor the frontend architecture, excluding game internals, so future changes are easier to locate, test, and make safely.

The refactor must preserve the current product exactly:

- no intentional UI changes;
- no intentional UX or interaction changes;
- no intentional route, URL, auth, persistence, or offline-behavior changes;
- no game-logic redesign;
- no backend contract changes unless required to preserve an existing frontend boundary;
- no broad rewrite or framework migration.

The target is a feature-oriented modular monolith that keeps React, Vite, TypeScript, Wouter, TanStack Query, Supabase, and the current visual system.

## Scope

In scope: application bootstrap, routing, authentication, public pages, student portal, teacher workspace, classrooms, assignments, reports, settings, API clients, query hooks, query keys, PWA/offline boundaries, frontend tests, and architecture documentation.

Explicitly out of scope: game visuals, game behavior, scoring, game sequencing, game UX, CSS redesign, framework migration, microfrontends, database changes, and Edge Function changes as an architectural shortcut.

## Target architecture

The codebase should converge toward these boundaries:

- `app/`: bootstrap, providers, router, and error boundaries;
- `features/`: auth, public-site, student-portal, teacher-workspace, classroom, assignments, reports, settings, and offline;
- `shared/`: UI primitives, layout, i18n, hooks, and utilities;
- `infrastructure/`: API transport, Supabase, persistence, and PWA adapters;
- `content/`: curriculum and lesson content;
- `games/`: the existing game subsystem, treated as a bounded context.

Dependency direction:

`routes/pages -> feature composition -> feature queries/use cases -> infrastructure adapters -> Supabase Edge Functions`

Shared code must not import feature code. Features may depend on shared code and approved infrastructure interfaces. Pages should compose features rather than own data-fetching policy and domain transformations.

## State rules

- TanStack Query owns remote/server state.
- Auth context owns active identity and teacher-viewing-student session state.
- URL state owns route parameters, report windows, and navigable filters.
- Local React state owns transient form, dialog, tab, and animation state.
- No new global store is introduced for convenience.
- Existing cache invalidation behavior is preserved and covered by tests before extraction.

## TDD and safety rules

Every migration slice follows this sequence:

1. Write a characterization or contract test for current behavior.
2. Run the test and record the expected baseline.
3. Make the smallest structural change.
4. Run focused tests, typecheck, and build checks.
5. Run the broader regression suite.
6. Commit one coherent change.

Tests assert behavior and contracts, not implementation details or CSS class names except where accessibility behavior requires it. Existing UI components remain the visual source of truth.

Every refactor commit requires a focused test, typecheck, build check, available regression tests, and no unexplained visual or behavior difference.

The current environment must first be normalized: TypeScript cannot currently resolve `workbox-precaching`, the Vite build cannot resolve `vite-plugin-pwa`, and Deno is unavailable for the configured test command.

## Commit plan

The refactor will use at least 40 focused commits. The following 52-commit sequence is the working plan. A commit may be split further, but unrelated changes must not be combined.

### Phase 0 — Baseline and test foundations

1. `docs: record frontend architecture refactor contract` — Add scope, invariants, and validation commands.
2. `chore: normalize frontend dependency installation` — Restore packages required by the existing Vite, PWA, and TypeScript configuration.
3. `test: establish a runnable frontend test command` — Add a Vite-native test harness, preferably Vitest with DOM support.
4. `test: add application bootstrap smoke coverage` — Verify the provider tree and router can mount.
5. `test: add route contract characterization tests` — Cover public, student, teacher, quiz, redirect, and not-found routes.
6. `test: add authentication state characterization tests` — Cover signed-out, teacher, student, and teacher-viewing-student states.

### Phase 1 — Stable application seams

7. `refactor: introduce app and shared aliases` — Add naming and barrel conventions without changing behavior.
8. `refactor: extract shared type and utility boundaries` — Move only genuinely cross-feature utilities and preserve compatibility exports.
9. `test: characterize navigation helpers` — Cover student and teacher active-navigation and URL normalization.
10. `refactor: isolate route definitions from App bootstrap` — Keep the same Wouter route table and rendered components.
11. `test: characterize provider ordering and readiness` — Cover QueryClient, auth, language, and router assumptions.
12. `refactor: create explicit application provider composition` — Move provider composition behind an app-level component.

### Phase 2 — API and server-state boundaries

13. `test: add API transport contract fixtures` — Cover method, body, search parameters, errors, and active auth client behavior.
14. `refactor: extract API transport adapter` — Separate generic function invocation from domain operations.
15. `test: add query-key contract tests` — Define stable keys for dashboard, classroom, assignment, report, and post data.
16. `refactor: introduce domain query-key factories` — Replace scattered literal keys while preserving cache identity.
17. `refactor: split classroom API module` — Move classroom operations behind a domain client and retain the API facade.
18. `refactor: split assignment API module` — Move assignment and assignment-quiz operations behind a domain client.
19. `refactor: split dashboard and report API modules` — Preserve response types and transport behavior.
20. `refactor: split attempt and post API modules` — Preserve submission, post, and invalidation behavior.
21. `test: characterize query and mutation invalidation` — Verify all existing successful mutations invalidate the same data.
22. `refactor: split React Query hooks by feature` — Move hooks into feature-owned modules while preserving names and result shapes.
23. `refactor: add typed DTO mapping boundaries` — Move legacy response shaping and role narrowing out of page components.
24. `refactor: preserve the public API facade during migration` — Make old imports delegate to new modules and document the transition.

### Phase 3 — Authentication and public application

25. `test: characterize auth client and profile transitions` — Cover refresh, sign-out, teacher, student, account viewing, and return-to-teacher behavior.
26. `refactor: extract auth session service` — Separate session/profile orchestration from React context rendering.
27. `refactor: isolate auth React context` — Keep the context contract while making its state machine explicit.
28. `test: characterize language provider behavior` — Cover language selection, persistence, and fallback behavior.
29. `refactor: move public pages into public-site feature` — Preserve landing, about, auth, and not-found routes.
30. `test: characterize shared application layout` — Cover navigation, role links, sign-out, language toggle, and student-view banner.
31. `refactor: move layout and navigation into shared boundaries` — Preserve markup, styles, and navigation helpers.

### Phase 4 — Student portal

32. `test: characterize student portal selectors and derived data` — Cover topic entries, rail summaries, next actions, and lesson URLs.
33. `refactor: create student portal feature model` — Move portal transformations into a feature-owned model layer.
34. `refactor: extract student dashboard composition` — Preserve loading, unavailable-data, assignment, classroom, and recent-attempt behavior.
35. `refactor: extract student classroom feature` — Preserve posts, classroom summary, and navigation behavior.
36. `test: characterize student lesson entry contracts` — Cover assignment links, free-play links, class IDs, return paths, and redirects.

### Phase 5 — Teacher workspace

37. `test: characterize teacher workspace view models` — Cover dashboard cards, roster rows, assignment rows, report windows, and empty states.
38. `refactor: create teacher workspace feature boundary` — Establish teacher shell, headings, and workspace-board boundaries.
39. `refactor: extract teacher today feature` — Preserve add-student, assign-quiz, and view-student actions.
40. `refactor: extract teacher classroom and roster feature` — Preserve loading, tabs, removal confirmation, and student-view behavior.
41. `refactor: extract teacher assignments feature` — Preserve assignment creation, rendering, retry, update, and delete behavior.
42. `refactor: extract teacher reports feature` — Preserve report windows, empty states, tables, and PDF export.
43. `refactor: extract teacher settings feature` — Preserve password change, sign-out, validation, and feedback behavior.

### Phase 6 — Offline, content, and route performance

44. `test: characterize offline media manifest behavior` — Cover manifest generation, cache selection, download failures, and readiness.
45. `refactor: isolate PWA and offline infrastructure` — Keep service-worker behavior and offline UI unchanged.
46. `refactor: isolate curriculum and lesson content modules` — Preserve data shapes and imports, excluding game internals.
47. `refactor: introduce non-game route-level lazy boundaries` — Lazy-load public, student, and teacher routes without visible changes.

### Phase 7 — Enforcement and handoff

48. `test: add architecture boundary and import-contract checks` — Prevent shared-to-feature imports, page-level API bypasses, and game-boundary leakage.
49. `docs: document frontend architecture and contribution rules` — Explain where new UI, state, API operations, tests, and routes belong.
50. `chore: remove temporary compatibility exports` — Remove only exports proven unused by import-contract checks.
51. `test: add final non-game regression matrix` — Run route, auth, student, teacher, API, PWA, type, and build checks together.
52. `refactor: finalize architecture migration` — Cleanup, naming consistency, and dead-file removal only.

## Definition of done

- All non-game features follow the feature-oriented boundaries.
- Existing routes and URLs behave the same.
- Auth and teacher account-switching behavior is preserved.
- API payloads, cache identity, and invalidation behavior are preserved.
- PWA/offline behavior is preserved.
- The game subsystem remains isolated and behaviorally untouched.
- Frontend tests run in a documented environment.
- Typecheck and production build pass.
- Architecture checks prevent the old dependency drift from returning.
- The final result contains at least 40 focused commits.

## Baseline notes

At planning time, the working tree is clean. The first validation attempt found setup failures before application tests could provide a meaningful result:

- TypeScript cannot resolve `workbox-precaching`.
- Vite cannot resolve `vite-plugin-pwa`.
- The configured Deno test command cannot run because Deno is not installed or available on `PATH`.

These are baseline setup tasks, not refactor regressions, and must be resolved before test results are used to judge migration commits.
