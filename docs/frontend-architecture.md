# MathVenture frontend architecture

The frontend remains a feature-oriented modular monolith. This refactor changes ownership and dependency direction only; it does not intentionally change UI, UX, routes, persistence behavior, offline behavior, authentication behavior, or game internals.

## Boundaries

- `src/app/` owns bootstrap, providers, and route composition.
- `src/features/` owns feature-specific hooks, policies, and UI-neutral view models.
- `src/infrastructure/` owns transport adapters, domain API modules, stable query-key contracts, and invalidation policy.
- `src/content/` owns lesson and curriculum data access.
- `src/shared/` owns reusable UI-neutral utilities.
- `src/lib/api/client.ts` remains the typed public API surface while domain operations are implemented under `src/infrastructure/api/`.
- Legacy teacher model paths currently re-export feature-owned models until all external test/import consumers migrate.
- `src/components/games/` and game-specific internals are out of scope for this refactor.

## State rules

- Server state belongs to TanStack Query.
- Auth identity and view-as-student state belong to the auth provider.
- Route/filter state belongs in the URL where it already exists.
- Transient interaction state stays local to the component or feature.
- New global state is not introduced without an explicit architecture decision.

## Change rules

1. Add or update a focused characterization test before moving behavior.
2. Preserve endpoint names, payloads, query-key identities, invalidation prefixes, and public imports.
3. Keep feature code out of shared and infrastructure layers.
4. Keep games outside non-game feature boundaries.
5. Keep page components dependent on feature-owned hooks and models rather than transport or legacy facades.
6. Run the frontend tests, typecheck, and production build before merging a refactor step.

Compatibility bridges can be removed only after all consumers migrate and an explicit regression proves the public import surface is no longer needed.
