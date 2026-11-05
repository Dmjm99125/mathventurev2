# Color Matching Generated Sprites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four-color Color Matching Game’s emoji cards with the generated red, green, yellow, and blue sprite assets while preserving existing gameplay and keeping an emoji fallback.

**Architecture:** Keep the current `ColorMatchingGame` component and randomized pool. Extend each pool entry with an asset path and accessible label, then render each selected item through a small local visual component that switches from the PNG to the original emoji if the image fails. Orange and purple files remain staged but are not added to the four-color game rules.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Vite, existing PNG assets under `frontend/public/assets/images/`.

## Global Constraints

- Keep the existing red, green, yellow, and blue color buckets and scoring behavior unchanged.
- Do not wire orange or purple into the game in this change.
- Preserve the original emoji as a runtime fallback when a sprite image fails.
- Do not weaken or skip existing tests, typecheck, or build gates.
- Run frontend tests within the repository’s bounded CI lane and run frontend typecheck/build before pushing.

---

### Task 1: Add failing sprite-wiring tests

**Files:**
- Create: `frontend/src/components/ColorMatchingGame.test.tsx`
- Test target: `frontend/src/components/games/1-colors/ColorMatchingGame.tsx`

**Interfaces:**
- Consumes: exported `COLOR_MATCHING_POOL` from `ColorMatchingGame.tsx` and the rendered `ColorMatchingGame` component.
- Produces: regression coverage for four-color asset mapping, rendered sprite paths, and emoji fallback behavior.

- [ ] **Step 1: Write the failing tests**

Create a test outside `src/components/games/**` because the current Vitest configuration excludes tests stored inside that game directory. Mock `canvas-confetti`, stabilize `Math.random()` to keep the first four pool entries deterministic, and assert:

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COLOR_MATCHING_POOL, ColorMatchingGame } from './games/1-colors/ColorMatchingGame';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('ColorMatchingGame generated sprites', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('maps every current pool item to a generated sprite asset', () => {
    expect(COLOR_MATCHING_POOL).toHaveLength(20);
    expect(COLOR_MATCHING_POOL.every((item) => item.assetSrc.startsWith('/assets/images/color-match-'))).toBe(true);
    expect(COLOR_MATCHING_POOL.map((item) => item.assetSrc)).toContain('/assets/images/color-match-red-ladybug-v2.png');
    expect(COLOR_MATCHING_POOL.map((item) => item.assetSrc)).not.toContain('/assets/images/color-match-orange-fruit.png');
    expect(COLOR_MATCHING_POOL.map((item) => item.assetSrc)).not.toContain('/assets/images/color-match-purple-grapes.png');
  });

  it('renders selected pool items as accessible sprite images', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<ColorMatchingGame />);

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(4);
    });

    expect(screen.getAllByRole('img').map((image) => image.getAttribute('src'))).toEqual([
      '/assets/images/color-match-red-strawberry.png',
      '/assets/images/color-match-red-apple.png',
      '/assets/images/color-match-red-tomato.png',
      '/assets/images/color-match-red-car.png',
    ]);
  });

  it('falls back to the original emoji when a sprite fails to load', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<ColorMatchingGame />);

    const firstImage = await screen.findByAltText('red strawberry');
    fireEvent.error(firstImage);

    await waitFor(() => {
      expect(screen.queryByAltText('red strawberry')).not.toBeInTheDocument();
      expect(screen.getByText('🍓')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```powershell
npm run test:frontend --prefix frontend -- src/components/ColorMatchingGame.test.tsx
```

Expected: FAIL because `COLOR_MATCHING_POOL` is not exported and the current game renders emoji-only cards.

### Task 2: Wire four-color sprites with fallback rendering

**Files:**
- Modify: `frontend/src/components/games/1-colors/ColorMatchingGame.tsx`
- Use: `frontend/public/assets/images/color-match-{red,green,yellow,blue}-*.png`

**Interfaces:**
- Consumes: the generated sprite paths listed in the design spec.
- Produces: exported `COLOR_MATCHING_POOL` entries with `emoji`, `color`, `assetSrc`, and `label`; a local visual renderer used by item cards.

- [ ] **Step 1: Add asset metadata to the pool**

Export the pool and add `assetSrc` plus `label` to each of the 20 existing entries. Preserve the current item order and color values, including the existing ladybug entry’s `color: 'red'`. Use only these paths for the supported colors:

```ts
/assets/images/color-match-red-strawberry.png
/assets/images/color-match-red-apple.png
/assets/images/color-match-red-tomato.png
/assets/images/color-match-red-car.png
/assets/images/color-match-red-balloon.png
/assets/images/color-match-red-ladybug-v2.png
/assets/images/color-match-green-apple.png
/assets/images/color-match-green-tree.png
/assets/images/color-match-green-frog.png
/assets/images/color-match-green-turtle.png
/assets/images/color-match-green-leaf.png
/assets/images/color-match-yellow-sun.png
/assets/images/color-match-yellow-banana.png
/assets/images/color-match-yellow-lemon.png
/assets/images/color-match-yellow-cheese.png
/assets/images/color-match-yellow-sunflower.png
/assets/images/color-match-blue-water-drop.png
/assets/images/color-match-blue-fish.png
/assets/images/color-match-blue-cap.png
/assets/images/color-match-blue-ice-cube.png
```

- [ ] **Step 2: Carry the metadata into generated game items**

Extend `Item` with `assetSrc` and `label`, and copy those fields in `generateRandomItems()` without changing the randomization or scoring fields.

- [ ] **Step 3: Add an image-to-emoji fallback visual**

Add a local `MatchingItemVisual` component with a `showFallback` state. Render the sprite with `alt={item.label}`, `className="h-20 w-20 object-contain md:h-24 md:w-24"`, and `onError={() => setShowFallback(true)}`. When `showFallback` is true, render the original emoji in a `span` with `role="img"` and `aria-label={item.label}`.

- [ ] **Step 4: Render the visual component from each card**

Replace `{item.emoji}` in the clickable item card with `<MatchingItemVisual item={item} />`. Keep the card click handler, selected styles, hide-on-match behavior, and all scoring logic unchanged.

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```powershell
npm run test:frontend --prefix frontend -- src/components/ColorMatchingGame.test.tsx
```

Expected: PASS with all three tests passing.

### Task 3: Run the complete affected quality gates

**Files:**
- Verify: `frontend/src/components/ColorMatchingGame.test.tsx`
- Verify: `frontend/src/components/games/1-colors/ColorMatchingGame.tsx`
- Verify: `frontend/public/assets/images/color-match-*.png`

- [ ] **Step 1: Run frontend typecheck**

```powershell
npm run typecheck --prefix frontend
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 2: Run the full frontend test lane**

```powershell
$process = Start-Process -FilePath "npm.cmd" -ArgumentList @("test:frontend", "--prefix", "frontend") -NoNewWindow -PassThru
if (-not $process.WaitForExit(110000)) { $process.Kill(); throw "Frontend tests exceeded the 110 second lane limit." }
if ($process.ExitCode -ne 0) { exit $process.ExitCode }
```

Expected: exit code 0 with no failed tests.

- [ ] **Step 3: Build the frontend**

```powershell
npm run build --prefix frontend
```

Expected: exit code 0 and a successful Vite production build.

### Task 4: Commit and push the verified implementation

**Files:**
- Add: `frontend/src/components/ColorMatchingGame.test.tsx`
- Modify: `frontend/src/components/games/1-colors/ColorMatchingGame.tsx`
- Add: generated `color-match-*.png` files except the superseded black-faced ladybug variant

- [ ] **Step 1: Inspect the final diff and exclude unrelated files**

Run:

```powershell
git status --short
git diff -- frontend/src/components/ColorMatchingGame.test.tsx frontend/src/components/games/1-colors/ColorMatchingGame.tsx
```

Do not stage `frontend/public/assets/audio/colors-new/` because it predates this implementation task and is unrelated.

- [ ] **Step 2: Commit the implementation**

```powershell
git add -- frontend/src/components/ColorMatchingGame.test.tsx frontend/src/components/games/1-colors/ColorMatchingGame.tsx frontend/public/assets/images/color-match-*.png
git restore --staged -- frontend/public/assets/images/color-match-red-ladybug.png
git commit -m "feat: wire color matching sprite assets"
```

- [ ] **Step 3: Push the current branch**

```powershell
git push cbar master
```

- [ ] **Step 4: Verify the pushed commit and remote CI status when available**

```powershell
git status --short
git log -2 --oneline
git ls-remote cbar refs/heads/master
```

If GitHub Actions access is available, inspect the workflow run for the pushed commit and report its actual status; otherwise report remote CI as unverified.
