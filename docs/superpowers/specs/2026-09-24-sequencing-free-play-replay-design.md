# Sequencing Free Play Replay Design

## Goal

Keep every sequencing Free Play game on its own completion screen after the
player finishes it. The player must be able to repeat that same game, while
advancing to another game remains an explicit choice.

## Root cause

The nine sequencing game components receive `allowSkip=true` in public Free
Play. When the final item is placed, each component immediately invokes its
parent `onComplete` callback inside the success handler. `QuizPage` interprets
that callback as completion of the current game and increments its game
index. This unmounts the sequencing game before its existing Free Play
completion/replay panel can be used.

Other topic games wait for an explicit completion or next-game control, so
their existing replay behavior is preserved.

## Design

### Sequencing game completion

Remove only the automatic parent completion callback from the final-item
success path in these nine components:

- `ArrangeNumbers`
- `ArrangeLetters`
- `SizeSorter`
- `ShortestLongest`
- `SmallestLargestCake`
- `SurpriseSequencing`
- `AnimalVehicleBuilder`
- `PatternTrainAcademy`
- `SandwichMaker`

The components will still transition their local state to the existing
completion panel. In Free Play, its current replay action will reset/restart
the same game. Their explicit header skip/next controls remain available for
players who intentionally want to move on.

### Assigned quiz behavior

Assigned quizzes keep their existing scoring and progression callbacks. No
`QuizPage` logic, checkpointing, persistence, or assigned-quiz navigation is
changed.

### Testing

Update the sequencing source-contract test to verify that all nine games:

- retain scored completion callback support and existing assigned-mode
  scoring paths;
- do not invoke the parent completion callback automatically from the
  `allowSkip` final-item success branch; and
- retain the Free Play replay action and explicit next-game control.

Run the focused sequencing tests, frontend typecheck, frontend build, and the
full frontend test suite before completion.

## Scope and non-goals

This change is limited to sequencing Free Play completion behavior. It does
not alter the shared quiz page, other topics' Free Play behavior, assigned
quiz semantics, scoring formulas, or game content.
