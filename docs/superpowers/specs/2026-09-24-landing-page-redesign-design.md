# MathVenture Landing Page Redesign

## Context

MathVenture's public landing page should feel immediately welcoming to children ages 4–7 while remaining polished enough for teachers and families. The existing `INDBG.jpg` jungle-and-rainbow background is a core brand asset and must remain the page background. The current page has correct navigation and actions, but its centered headline, generic feature cards, and repeated button treatment do not create a memorable entry point.

## Direction

Use a restrained version of the “Jungle Carnival” direction: playful color, tactile cards, and kid-friendly movement with a clean editorial hierarchy. The page will use the Chaotic Maximalism anchor in a controlled way—hot pink, cyan, acid yellow, orange, and deep jungle green will appear as accents and card surfaces, while the background stays visible and the content remains easy to scan.

The differentiator is a compact “adventure board” hero: the legacy `1let.png` “LET’S LEARN!” artwork anchors the top of the content, while three oversized activity cards act as the page’s visual path into colors and shapes, numbers, and teacher support. Cards will use varied but intentional rotations and hover lift rather than dense decoration.

## Content and interaction

- Preserve the existing actions and destinations: `Free Play` → `/free-play`, `Teacher Sign Up` → `/signup`, `Login` → `/login`, and `Meet The Researchers` → `/about`.
- Make `Free Play` the dominant action for a child or family visitor.
- Keep the copy grounded in real product capabilities: colors, shapes, numbers, sequencing, and teacher progress tools.
- Use Lucide icons for interface icons. Do not use Unicode characters as icon substitutes.
- Add hover and keyboard-focus states to the adventure cards and actions; respect `prefers-reduced-motion`.
- Keep the existing auth redirect behavior unchanged.

## Visual system

- Background: existing `/assets/images/INDBG.jpg`, still covering the viewport.
- Typography: existing Bricolage Grotesque for display and Nunito for body/interface copy, with the existing global font setup preserved.
- Accents: hot pink `#FF71CE`, acid yellow `#DFFF00`, cyan `#00FFFF`, orange `#FF7A1A`, and jungle green for readable text.
- Texture: low-opacity dotted or diagonal card textures created with CSS gradients; no new image generation or dependency.
- Layout: responsive two-column hero on large screens, stacked content on small screens; translucent white content surfaces provide contrast without hiding the background.

## Scope and boundaries

Modify only the landing page presentation and page-local styling. Do not change authentication, routes, `TopNav` behavior, shared button APIs, or the student/teacher application shells. Do not add dependencies.

## Verification

Run the frontend typecheck and production build after implementation. Run the existing frontend test command if the environment supports Deno; existing tests must remain unchanged and no test lane may be skipped or weakened.
