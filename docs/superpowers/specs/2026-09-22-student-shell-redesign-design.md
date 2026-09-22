# Student Home and Classroom Shell Redesign

## Context

MathVenture's student shell serves kindergarten learners who need large, obvious actions, low reading burden, and consistent orientation across the home lesson map and classroom page. The current shell already has a jungle/adventure identity and fixed illustrated headings, but navigation, status cues, and action hierarchy are easy to miss or require too much interpretation.

Scope is limited to the student home/classroom shell. Individual quiz and game screens remain unchanged.

## Visual direction

Use the Organic anchor as a calmer “learning garden” direction rather than introducing a louder playroom treatment. The shell will use the existing jungle concept with sand `#E8DCC7`, sage `#8B9D83`, clay `#B08B6E`, terracotta `#C66B3D`, ochre `#C08E3A`, and moss `#606C38`; rounded 16–32px surfaces; warm humanist typography already available in the project; and a light grain texture.

The differentiator is a visible “trail stop” treatment: every lesson or classroom action is a large numbered stop with an illustration, a written status, and one clear primary action. Status is never communicated by color alone.

The existing “Let’s Learn!” and “Tayo ay Matuto!” illustrated header is a fixed product component. It must remain visible in the lesson area, in the existing order, with its image fallbacks preserved. The redesign may improve its surrounding container and spacing but must not remove, replace, or hide it.

## Home shell

- Add a student-only shell wrapper so the Organic palette and texture do not alter teacher pages or quiz/game screens.
- Keep the MathVenture brand, language control, and profile menu available, but make them visually secondary to the learner’s next action.
- Present two clear student destinations—Lessons and Classroom—with icon + text labels. Desktop and mobile use the same labels and route meaning; mobile uses large touch-friendly controls rather than relying on an ambiguous single sidebar item.
- Keep the next assigned lesson prominent when one exists, with the existing assignment routing and translated labels intact.
- Keep progress visible as a small set of readable cards for streak, completed lessons, and recent score. Each value is paired with its label and is not color-only.
- Present assigned lessons as large trail stops. Preserve current assignment filtering, lesson ordering, asset images, fallback labels, completion logic, and navigation hrefs.
- Replace status-only dots with readable status pills/labels such as “Assigned” and “Finished” where the current data supports them. Do not invent progress or lesson data.
- Preserve the empty state when no classroom quizzes are assigned and keep its instructional message.

## Classroom shell

- Use the same student shell wrapper, spacing, palette, and navigation as the home page.
- Provide a prominent “Back to my lessons” control that returns to `/student`.
- Keep teacher announcements and classroom quiz data unchanged. Restyle announcements into clear, readable cards with author/date information still visible.
- Restyle quiz rows into wide, easy-to-scan cards. Retain the current per-status actions: Start Quiz, Resume, or View Result. Keep assignment names, lesson labels, scores, and one-attempt wording intact.
- Preserve the no-classroom and no-announcement states, keeping their existing meaning and recovery actions.

## Interaction and accessibility

- Keep primary controls at least 48px tall/wide and use visible focus states.
- Use color plus text/icon/status labels for assignment and completion states.
- Preserve reduced-motion behavior and avoid adding motion that is required to understand a control.
- Ensure responsive layouts stack cleanly at mobile widths without horizontal scrolling.
- Keep the fixed bilingual header artwork visible and give it meaningful alt text/fallback text.

## Boundaries and data flow

No API, route, scoring, assignment, auth, or quiz data-flow changes are planned. Changes should stay in the student page, student shell components, student navigation presentation, and scoped CSS. Existing hooks and portal summary helpers remain the source of truth.

## Verification

After implementation, run the project’s relevant gates:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`

Also inspect the rendered student home and classroom layouts at desktop and narrow mobile widths, confirming the bilingual fixed header remains present and no teacher or quiz/game screen styling is changed.
