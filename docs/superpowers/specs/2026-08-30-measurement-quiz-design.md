# Measurement Assigned Quiz Design

## Goal

Make all six measurement games behave consistently when launched as an assigned classroom quiz while leaving free play unchanged.

## Behavior contract

- Assigned mode is identified by `allowSkip === false`.
- Each measurement game has a fixed number of quiz items. A correct response adds one point; a wrong response adds no points but still consumes the current item.
- A classroom game cannot be completed, advanced, replayed, reset, or returned to its setup screen until its fixed item count has been answered.
- Assigned completion reports the scored result as `onComplete(score, fixedMaxScore)`. The parent `QuizPage` remains responsible for advancing and persisting the per-game result.
- Free play keeps its current retry, replay, skip, and setup behavior.
- The shared `DrawingCanvas` is not rendered in the classroom quiz route. The stale data entry is documented for a separate cleanup and is not expanded into this implementation.

## Game-specific rules

- `SlowFun`: one mole selection consumes one item, including a wrong mole; the timer and setup controls cannot restart the assigned quiz.
- `SmallShort`: one size selection consumes one item; wrong size selections advance immediately in assigned mode.
- `LightHeavy`: one weight selection consumes one item; wrong selections advance immediately in assigned mode.
- `TinyBuilderRuler`: one ruler-length selection consumes one item; a wrong choice advances immediately in assigned mode rather than allowing another choice in the same item.
- `MagicRainbowBridge`: releasing the bridge consumes one item regardless of measurement result; assigned completion uses the current attempt count and a fixed maximum.
- `SnakeGame`: the assigned quiz uses a fixed food target; a collision consumes the current item and ends the game with one classroom completion action. The classroom collision overlay cannot expose replay.

## Testing

Every game receives regression coverage for wrong-item consumption, fixed completion scoring, assigned controls, and preserved free-play behavior. Existing measurement layout and mobile-fit tests remain in the focused suite.
