# Frontend Directory Layout Design

## Goal

Place the complete browser application inside `frontend/` while keeping `supabase/` as the root-level backend boundary and preserving local development, builds, tests, and deployment configuration.

## Approved structure

- `frontend/src/`: React application source and PWA code.
- `frontend/public/`: browser-served assets, icons, and media.
- `frontend/test/`: frontend and browser-application tests.
- `frontend/scripts/`: frontend build and asset-generation scripts.
- `frontend/index.html`: Vite HTML entry point.
- `frontend/package.json` and `frontend/package-lock.json`: frontend dependencies and commands.
- `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/deno.json`, and `frontend/components.json`: frontend tooling configuration.
- `frontend/netlify.toml`: frontend hosting configuration.
- `supabase/`: backend migrations, functions, and configuration, unchanged at the repository root.
- `test/supabase/`: backend test suite, kept outside the frontend boundary.

Root documentation and repository metadata remain at the root. Existing generated directories and unrelated working-tree changes are preserved.

## Runtime and path changes

Vite will use `frontend/` as its project root, resolve `@` to `frontend/src`, load environment variables from `frontend/`, and write production output to `frontend/dist`. Frontend tests will run from `frontend/` and use paths relative to the relocated test tree. The README will document the new `cd frontend` workflow and the separate root-level Supabase workflow.

## Verification

After relocation, run the frontend typecheck, frontend test suite, frontend production build, and the backend Supabase test suite. Also inspect the resulting tree and git diff to confirm no frontend runtime or tooling files remain outside `frontend/`.
