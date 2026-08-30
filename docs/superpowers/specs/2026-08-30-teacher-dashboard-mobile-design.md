# Teacher Dashboard Mobile Responsiveness

## Summary

Make the full teacher area usable on phones and tablets while preserving the existing classroom-board composition and desktop behavior. The scope includes `/teacher`, `/teacher/reports`, and `/teacher/settings`, plus the shared teacher workspace shell and its class tables.

## Goals

- Support phone widths around 320–430px and tablet widths from approximately 768px upward.
- Preserve the existing two-column teacher board on desktop.
- Stack or compress the teacher rail at smaller widths without introducing route or data changes.
- Keep page actions reachable and touch-friendly when headings and controls wrap.
- Prevent page-level horizontal overflow.
- Preserve dense table columns through intentional horizontal scrolling.
- Keep the two class-workspace tabs usable at narrow widths.
- Retain accessible keyboard focus and semantic navigation.

## Non-Goals

- No backend, database, or API changes.
- No teacher route changes.
- No redesign of the teacher information architecture.
- No conversion of tables into cards on mobile.
- No separate mobile-only app shell unless the existing layout proves insufficient.

## Chosen Direction

Use a responsive, in-place update to `TeacherWorkspaceBoard` and the existing teacher components. The implementation will use the current Tailwind breakpoints and shared components rather than duplicating desktop and mobile markup.

The existing top navigation already exposes a compact hamburger-style account menu on small screens. It will remain the fallback for teacher navigation. A second overlay drawer will not be added unless the three-item teacher navigation becomes crowded during implementation.

## Responsive Behavior

### Desktop

- At `lg` and above, preserve the 280px left teacher rail and flexible content panel.
- Keep the board’s rounded, bordered, classroom-board treatment.

### Tablet

- From `md` below `lg`, compress the teacher rail into a shallow top strip.
- Keep teacher identity and navigation visible in a compact horizontal arrangement.
- Allow navigation to scroll horizontally rather than widening the page.
- Keep the main content panel full width with reduced spacing.

### Phone

- Stack the teacher identity above the navigation.
- Reduce board padding, heading scale, and vertical gaps.
- Allow the navigation row to scroll horizontally if needed.
- Use the existing top-nav menu as the compact navigation fallback.
- Make action groups wrap or stretch to the available width.
- Keep tables inside bounded horizontal-scroll containers.
- Avoid page-level horizontal overflow.

## Component Changes

### `TeacherWorkspaceBoard.tsx`

- Add responsive layout classes for the rail, identity block, navigation, board padding, and content section.
- Keep navigation semantic and keyboard accessible.
- Ensure heading and action regions wrap without clipping.
- Preserve existing active-state behavior and logout behavior.

### `src/pages/teacher.tsx`

- Make page headings scale down on phones.
- Make action groups wrap and become full-width where appropriate.
- Make the classroom tabs wrap or scroll without forcing the viewport wider.

### Student tables

Update `TeacherStudentListTable.tsx` and `TeacherStudentProgressTable.tsx` to:

- Preserve table structure on every viewport.
- Use stable minimum widths for dense columns.
- Keep action buttons and expanded game-score controls from collapsing.
- Keep expanded details readable inside the existing scroll context.

### Reports and settings

Use the shared board’s responsive spacing and header/action behavior so the reports picker, report cards, tables, PDF action, and settings placeholder inherit the same mobile treatment. No page-specific data behavior changes are required.

## Accessibility

- Preserve semantic `nav`, table, button, and link elements.
- Maintain visible focus states for navigation, tabs, table actions, and report controls.
- Keep interactive targets at a comfortable touch size.
- Ensure horizontally scrollable regions remain discoverable without relying on hover.
- Preserve accessible names and `aria-expanded`/`aria-controls` behavior for expandable game details.

## Testing and Acceptance

Run:

- `npm run typecheck`
- `npm run build`
- the existing test suite

Manually inspect teacher pages at approximately 320px, 390px, 768px, and 1024px widths. Confirm:

1. No page-level horizontal overflow appears.
2. The teacher rail/header remains usable at each width.
3. Navigation remains reachable through the compact menu and visible rail navigation.
4. Headings and actions do not clip or overlap.
5. Student and progress tables scroll horizontally within their containers.
6. Tabs remain usable.
7. Expanded progress details remain readable.
8. Keyboard focus remains visible.

## Implementation Boundary

The work is limited to responsive presentation and interaction ergonomics in the teacher frontend. Existing routes, data contracts, business logic, and student-facing pages remain unchanged.

`TeacherClassCard.tsx` exists as an unused component in this checkout and is not part of the active teacher routes, so it is intentionally unchanged.
