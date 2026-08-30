# Teacher Mobile Navigation Strip Removal

## Summary

Remove the duplicate teacher identity and navigation strip from mobile teacher pages. The existing top navigation already provides the teacher’s hamburger menu, so mobile should use that single navigation entry point while desktop and tablet retain the current teacher rail.

## Goals

- Hide the teacher rail below the `md` breakpoint.
- Remove the mobile avatar, “Welcome, <name>” text, teacher navigation buttons, and logout control from the board.
- Keep the existing `TopNav` hamburger menu as the mobile teacher navigation.
- Keep page-specific actions such as `Assign Quiz`, `+ Add`, and `Export PDF` visible.
- Preserve the current tablet and desktop teacher rail unchanged.
- Make no changes to routes, data, APIs, or student-facing pages.

## Non-Goals

- No new drawer, menu state, or mobile navigation component.
- No changes to the top navigation itself.
- No changes to page headings, tables, reports data, or dialog behavior.
- No changes to the `md` breakpoint definition.

## Chosen Direction

Apply a responsive visibility utility to the existing `TeacherWorkspaceBoard` rail. The rail will use `hidden md:flex`, while the existing main content section remains in place and continues to use its current responsive spacing. This keeps the change local, declarative, and easy to remove or adjust later.

## Responsive Behavior

### Below `md`

- The entire teacher rail is not rendered visually.
- The main content occupies the full available board width.
- The top-nav hamburger exposes teacher navigation and logout.
- Page-specific actions remain visible and retain their existing mobile wrapping.

### `md` and above

- The teacher rail remains visible with the current avatar, welcome text, navigation, and logout control.
- Existing tablet and desktop layout behavior remains unchanged.

## Component Change

Modify `src/components/teacher/TeacherWorkspaceBoard.tsx` only. Add `hidden md:flex` to the existing `<aside>` class list. Do not remove or duplicate its contents, and do not change the main content panel.

## Accessibility

- The mobile board must not expose a visually hidden duplicate navigation tree to assistive technology; hiding the rail with `display: none` removes it from the accessibility tree.
- The existing top-nav hamburger and its menu items remain the accessible mobile navigation.
- Desktop/tablet navigation semantics and focus behavior remain unchanged.

## Testing and Acceptance

Run:

- `npm.cmd run typecheck`
- `deno test --allow-read test/src/lib/teacher/navigation.test.ts test/src/pages/teacher-assignment.test.ts`
- `npm.cmd run build`

Confirm statically that:

1. The teacher rail has `hidden md:flex`.
2. No page-specific action markup was removed.
3. No route or data files changed.
4. The only untracked file remaining, if any, is the pre-existing `.tmp-shape-matching-build/` directory.

## Commit Structure

Use three commits for this change:

1. Documentation commit containing this spec.
2. Planning commit containing the implementation plan.
3. Implementation commit containing the responsive teacher-board change.
