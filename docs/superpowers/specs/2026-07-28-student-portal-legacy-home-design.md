# Student Portal Legacy Home Design

## Summary

Replace the current student post-login dashboard with a portal-style home screen that combines a soft, child-friendly school-info rail on the left with a large lesson-selection stage on the right that closely reuses the original MathVenture menu artwork.

This page becomes the first screen a student sees after login. It should feel familiar to the original prototype, preserve the playful tone of the product, and still surface real classroom data such as assignments, classes, and lightweight progress.

## Goals

- Make the student post-login home screen visually resemble the original portal screen.
- Reuse as many existing legacy assets as practical instead of redrawing the lesson menu.
- Keep the experience child-friendly, bright, and easy to scan.
- Show school context on the left without overpowering the lesson menu.
- Allow students to open any lesson from the right-side lesson menu at any time.
- Keep teacher-assigned lessons visible and gently highlighted without locking other lessons.
- Remove the current free-play area from the student home screen.

## Non-Goals

- Rebuilding the teacher dashboard.
- Changing lesson content or the `/student/lessons/:topic` route model.
- Replacing the existing lesson assets with newly illustrated labels.
- Turning the student home into a metrics-heavy dashboard.
- Introducing lesson locking or gated progression on the portal screen.

## Chosen Direction

The approved direction is `A. Storybook Rail`.

This direction keeps the right side as the main visual attraction and uses a gentle, rounded left rail for student-specific context. It is the warmest option, preserves the strongest connection to the original portal, and gives school information a clearer hierarchy than the current dashboard layout.

## Product Constraints

- The student home screen must prioritize immediate lesson entry.
- All lessons shown on the right remain playable regardless of assignment status.
- Teacher assignments should be emphasized, not enforced, on this page.
- The child-facing copy must stay short and positive.
- The custom portal layout should not compete with the app's existing student sidebar.
- The free-play promo block on the student home page must be removed.

## User Experience

## Primary Layout

On desktop, the student portal uses a two-part split:

- Left rail: `25%` of the page width
- Right lesson stage: `75%` of the page width

The left rail is the helper column. The right stage is the destination.

The right side should feel like the main "game menu" and should visually dominate the screen. The left side should feel supportive, not administrative.

## Left Rail Content Order

The left rail should use one clear stack in this order:

1. `Next Assignment`
2. `My Class`
3. `My Progress`

This order is intentional:

- `Next Assignment` gives the child the clearest next step.
- `My Class` preserves the classroom connection.
- `My Progress` gives a small sense of achievement without turning the rail into a stats panel.

## Right Lesson Stage

The right side recreates the spirit of the original lesson menu using the real legacy assets. It should open with the bilingual header art and the original topic label images displayed in the classic order:

1. Colors
2. Shapes
3. Sequencing
4. Addition
5. Subtraction
6. Numbers
7. Measurement
8. Comparison
9. Clock

Each topic row remains directly tappable and routes into the existing lesson flow for that topic.

## Visual Direction

## Asset Reuse

The screen should reuse the original student-menu art whenever possible. The key assets are:

- `public/assets/images/1bg.jpg`
- `public/assets/images/1let.png`
- `public/assets/images/1lets.png`
- `public/assets/images/1col.png`
- `public/assets/images/1sha.png`
- `public/assets/images/1seq.png`
- `public/assets/images/1add.png`
- `public/assets/images/1SUB.png`
- `public/assets/images/1NUM.png`
- `public/assets/images/1MEA.png`
- `public/assets/images/1COM.png`
- `public/assets/images/1CLO.png`
- `public/assets/images/home.png` if a home icon is still useful in-context

These assets should be treated as the visual source of truth for the right-side lesson stage.

## Child-Friendly Modernization

The page should not be a raw HTML port of the original screen. It should modernize the layout while preserving the recognizable artwork:

- The left rail uses rounded cards, calm spacing, and short labels.
- The right side keeps the old menu look, but with cleaner spacing and responsive behavior.
- The overall page should feel more readable and less cramped than the prototype.
- Modern layout polish should support the original art, not replace it.

## Visual Hierarchy

The page hierarchy should read in this order:

1. Bilingual header artwork
2. Lesson list
3. Assignment prompt in the left rail
4. Class info
5. Small progress summary

The current student dashboard emphasis on cards, charts, and stats should not carry over into this page.

## Behavior

## Lesson Interaction

Every lesson in the right-side stage must remain active at all times.

- Assigned lessons may receive a subtle cue.
- Non-assigned lessons must remain fully playable.
- The portal must not imply that students are blocked from exploring other lessons.

The goal is to guide without restricting.

## Assignment Highlighting

Assignments should be surfaced in two places:

- prominently in the `Next Assignment` card on the left
- softly on the corresponding lesson item on the right

Recommended right-side cues:

- a small badge
- a glow
- a dot marker
- a gentle border or emphasis state

The cue must stay smaller than the lesson label image itself.

## Empty States

When no assignment exists, the left rail should switch to an encouraging message such as:

- "Pick any lesson to play."
- "Choose your next adventure."

It should not show a cold empty-state treatment.

When no joined classes exist, the rail may show a friendly join-class prompt, but this prompt must remain smaller than the assignment and lesson content.

## Loading States

The page should avoid plain technical loading text where possible.

Loading should feel playful and on-theme, using one light branded loading presentation rather than a generic dashboard spinner.

## Routing And Data Responsibilities

## Route Role

`StudentDashboard` becomes the portal home after login.

The route contract stays the same:

- `/student` remains the student landing page
- `/student/lessons/:topic` remains the lesson entry route

No new top-level student route is required for this redesign.

## Data Sources

The left rail should keep using the existing student dashboard data sources wherever possible:

- student dashboard summary
- assignments
- classes
- recent attempt data

This redesign should be a presentation and composition change first, not a data-model rewrite.

## Component Boundaries

The page should be decomposed into smaller responsibilities:

- `StudentDashboard`: page orchestration, layout, and data assembly
- legacy lesson menu component: right-side topic list and asset rendering
- rail section component(s): assignment, class, and progress blocks

The right-side lesson stage should be isolated enough that it can be tuned without mixing all of its presentation logic into the rest of the dashboard page.

## App Shell Changes

The existing student app shell currently includes a left navigation sidebar that competes with the requested custom left rail.

For this portal page:

- the student home screen should use a lighter shell
- the extra persistent student sidebar should not appear alongside the portal
- the custom portal left rail becomes the primary side structure on this page

This change can be page-specific. The existing teacher shell and other student routes do not need to inherit this portal treatment automatically.

## Responsive Behavior

## Desktop

Desktop should preserve the requested split as closely as practical:

- left rail at roughly `25%`
- right stage at roughly `75%`

The lesson artwork should remain prominent and readable without forcing the child to hunt for the menu.

## Mobile

Mobile should not keep the rigid horizontal split.

Instead:

- the left rail stacks first at the top
- the lesson stage becomes full-width beneath it
- topic label images remain large enough to recognize and tap comfortably

The mobile experience should still feel like the same portal, not like a fallback list view.

## Accessibility And Robustness

## Asset Fallbacks

If any legacy image fails to load, the page should fall back to readable text labels rather than leaving a broken visual gap.

This matters especially for:

- lesson label assets
- header artwork assets

## Interaction Clarity

Even though the page is image-led, each lesson entry still needs clear interactive affordance. Children should be able to tell that the lesson rows are tappable.

## Copy Discipline

Left-rail copy should stay:

- short
- positive
- concrete
- non-technical

Avoid school-admin language and avoid overexplaining the progress area.

## Testing Strategy

Minimum implementation verification should cover:

- desktop student portal layout
- mobile student portal layout
- removal of the current free-play home section
- correct routing for every right-side topic entry
- assignment highlight presence without disabling other lessons
- lighter shell behavior on the student portal page
- graceful no-assignment state
- graceful no-class state
- fallback rendering if a legacy asset is unavailable

## Manual Acceptance Criteria

The redesign is successful when:

1. A student logs in and lands on `/student`.
2. The first screen clearly shows a child-friendly left helper rail and a legacy-style lesson world on the right.
3. The original lesson image labels are reused on the right.
4. The current free-play area is no longer present.
5. An assigned lesson is visible and encouraged, but every lesson still opens.
6. The student page no longer feels cramped by the old app sidebar.
7. The layout still works on mobile without losing the portal feel.

## Implementation Notes

- Prefer reusing real assets over recreating them in CSS.
- Keep changes focused on the student portal surface.
- Avoid unrelated refactoring outside the student home layout and its immediately supporting components.
- Preserve the existing lesson routes and existing student data hooks where possible.
