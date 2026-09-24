# Responsive About Page Actions Design

## Purpose

Improve the About page’s Home, Papers, and Project links controls for desktop and mobile without adding them to the landing page.

## Visual direction

Use the existing Chaotic Maximalism direction: MathVenture’s pink, yellow, and cyan accents remain the visual signature, but the controls are organized into a deliberate action dock so the page stays clear for teachers and researchers.

## Layout

- Keep the action controls inside the About page hero only.
- On desktop, place the action dock beneath the hero copy and let it span the hero width.
- Present Home, Papers, and Project links as a horizontal row with consistent control height, spacing, borders, and focus treatment.
- On mobile, keep the dock beneath the hero copy and switch it to one full-width control per row.
- Make dropdown triggers full width on mobile and keep their menus comfortably readable without changing their existing links or labels.
- Preserve the existing Home link, Papers menu, Project links menu, icons, keyboard behavior, and accessible label.

## Hero typography

Make the three hero messages substantially lighter than the current treatment:

- “Meet the people behind MathVenture” uses the existing eyebrow style at weight 600.
- “Learning feels better when it is made with care.” uses the existing display typeface at weight 600.
- The supporting paragraph uses the existing body typeface at weight 600.

No copy, font family, palette value, background, or other page section changes are included.

## Implementation boundaries

- Modify only About-page markup if a small semantic wrapper/class is required and the About-page stylesheet partial.
- Do not add controls to `landing.tsx`.
- Do not alter shared `TopNav` behavior.
- Keep desktop and mobile breakpoints aligned with the existing researchers-page rules.
- Verify typecheck, production build, diff whitespace, and the existing test command.
