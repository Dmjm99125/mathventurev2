# MathVenture Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans (inline execution here). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public MathVenture landing page into a clean, kid-friendly adventure board while preserving the existing jungle background, routes, auth redirect, and legacy “LET’S LEARN!” artwork.

**Architecture:** Keep the existing `Landing` component and `TopNav` integration. Replace the current centered hero/card markup with a responsive hero board composed of a brand panel, action panel, and three content cards. Add page-local class names and CSS in `index.css` so the design remains isolated from shared application shells.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, existing Bricolage Grotesque/Nunito fonts, lucide-react.

## Global Constraints

- Preserve `/assets/images/INDBG.jpg` as the landing-page background.
- Preserve all existing landing destinations and auth redirect behavior.
- Use `/assets/images/1let.png` as the legacy learning artwork.
- Use Lucide icons rather than Unicode icon substitutes.
- Do not add dependencies or weaken existing tests.
- Verify with frontend typecheck and production build; run frontend tests when Deno is available.

### Task 1: Build the landing adventure board

**Files:**
- Modify: `frontend/src/pages/landing.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: existing `useAuth`, `useLocation`, `TopNav`, `Button`, and `Link` APIs.
- Produces: the same `Landing` export and the same public routes, with new page-local markup classes `.landing-page`, `.landing-board`, `.landing-brand-panel`, `.landing-action-panel`, and `.landing-activity-card`.

- [x] **Step 1: Update the component structure**

Replace the current decorative hero and generic `FeatureCard` markup with a two-column board on large screens, a brand panel on the left, and a “Choose a path” panel on the right. Use `/assets/images/1let.png` with alt text `Let's learn!` as the hero wordmark. Keep the existing four destinations: `/free-play`, `/signup`, `/login`, and `/about`.

Use actual product copy from the current page for the activity cards: “Colors & Shapes”, “Numbers 1–10”, and “Teacher Dashboard”. Keep every link action standard and explicit.

- [x] **Step 2: Add page-local visual tokens and responsive styles**

Add a `.landing-page` block to `frontend/src/index.css` that keeps the existing background image and cover positioning, adds a light readable overlay without replacing the image, uses hot pink/cyan/acid yellow/orange only on accents and cards, gives the board a clean max-width and generous spacing, uses dotted/diagonal CSS textures on card surfaces, includes visible `:hover` and `:focus-visible` states, stacks the grid on small screens, and disables transforms/animation under `prefers-reduced-motion: reduce`.

- [x] **Step 3: Remove obsolete component code**

Delete the old `FeatureCard` helper and any imports that are no longer used. Keep only icons required by the new layout.

- [x] **Step 4: Run focused static checks**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: both commands exit with code 0 and Vite emits the production bundle.

- [x] **Step 5: Run the frontend test lane when available**

Run:

```powershell
npm test
```

Expected: the existing Deno test suite passes without modified tests or focused filters. Deno was unavailable in this environment (`'deno' is not recognized as an internal or external command`), so this lane remains unverified; typecheck and build completed successfully.

- [x] **Step 6: Review the final diff**

Run:

```powershell
git diff --check
git status --short
```

Confirm only the landing page, its CSS, and the implementation plan are changed beyond the already committed design spec. Preserve unrelated untracked files.
