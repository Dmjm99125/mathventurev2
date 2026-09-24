# Responsive About Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition the About page’s Home, Papers, and Project links into a responsive action dock and make the hero copy substantially lighter.

**Architecture:** Reuse the existing About markup and `researchers.css` partial. The hero becomes a single reading column with the action group spanning the full hero width on desktop; the same group becomes one full-width control per row on mobile. No landing-page or shared-navigation code changes are required.

**Tech Stack:** React, Wouter, Tailwind CSS 4, Vite, existing `researchers.css` responsive rules.

## Global Constraints

- Keep the controls on the About page only; do not add them to `landing.tsx`.
- Preserve the existing Home link, Papers menu, Project links menu, icons, labels, dropdown behavior, and accessible label.
- Use the existing MathVenture palette and font families; do not change the page background or other sections.
- Set the three hero message weights to 600.
- Keep the change limited to `frontend/src/styles/researchers.css` unless verification proves a markup adjustment is necessary.

---

### Task 1: Update the About hero action dock and typography

**Files:**
- Modify: `frontend/src/styles/researchers.css`
- Read: `frontend/src/pages/about.tsx`

**Interfaces:**
- Consumes: the existing `.researchers-hero`, `.researchers-hero-actions`, `.researchers-toolbar-button`, `.researchers-eyebrow`, and `.researchers-hero-copy > p` selectors.
- Produces: responsive styling for the existing About-page controls with no JSX or landing-page changes.

- [ ] **Step 1: Make the desktop hero a single reading column**

Update the base `.researchers-hero` rule so its grid uses one column, allowing the copy to read first and the action dock to span the hero beneath it.

- [ ] **Step 2: Style the desktop action dock as a horizontal row**

Update `.researchers-hero-actions` to span the hero width, use three equal flexible columns, and include a separating top rule. Ensure direct link/button children fill their grid cells and the existing toolbar buttons center their content.

- [ ] **Step 3: Make mobile actions one column per row**

Inside the existing `@media (max-width: 640px)` block, change `.researchers-hero-actions` to one column and make each direct link/button full width. Keep the existing mobile hero and dropdown behavior intact.

- [ ] **Step 4: Lighten only the three hero messages**

Separate the shared eyebrow/label/role typography rule so only `.researchers-eyebrow` becomes weight 600, set `.researchers-hero h1` to weight 600, and set `.researchers-hero-copy > p` to weight 600. Leave section labels and profile roles at their existing weight.

### Task 2: Verify responsive wiring and preserve scope

**Files:**
- Read: `frontend/src/styles/researchers.css`
- Read: `frontend/src/pages/about.tsx`
- Read: `frontend/src/pages/landing.tsx`

**Interfaces:**
- Consumes: the updated About stylesheet.
- Produces: verified responsive styling with no landing or shared-nav changes.

- [ ] **Step 1: Confirm selector and scope boundaries**

Run:

```powershell
rg -n "researchers-hero|researchers-hero-actions|researchers-toolbar-button|researchers-eyebrow|researchers-hero-copy|landing-page|TopNav" frontend/src/styles/researchers.css frontend/src/pages/about.tsx frontend/src/pages/landing.tsx
git diff --check
```

Expected: the action-dock rules are confined to `researchers.css`, About still owns the three controls, landing remains unchanged, and there are no whitespace errors.

- [ ] **Step 2: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: TypeScript exits with code 0.

- [ ] **Step 3: Run the production build**

Run:

```powershell
npm run build
```

Expected: Vite completes successfully and emits the production assets.

- [ ] **Step 4: Run the repository test command**

Run:

```powershell
npm test
```

Expected: tests execute if Deno is available; otherwise report the environment blocker without changing test configuration.

- [ ] **Step 5: Commit the implementation**

Run:

```powershell
git add frontend/src/styles/researchers.css
git commit -m "feat: refine responsive about actions"
```

Expected: only the About stylesheet changes are committed.
