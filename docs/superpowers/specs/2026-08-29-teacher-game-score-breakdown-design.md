# Teacher Game Score Breakdown Design

**Goal:** Show teachers each student’s overall latest quiz score and a per-game score breakdown while preserving the existing detailed result records.

## Approved design

The classroom **Student Progress** table stays compact. Each student row shows the existing completion and last-played metrics plus an overall latest score. A row can be expanded to show the student’s latest completed result for every game, displayed as `score / max score` and percentage.

The existing `attempt_game_results` table remains the source of truth for game-level records. The roster endpoint will return the latest completed game result per student and game, plus the latest completed overall attempt per student. No new scoring table or duplicate write path is needed.

## Data flow

1. `classes-roster` queries completed attempts and their detailed game rows for the teacher’s classroom.
2. It groups rows by student and game, keeping the newest result for each game. It also keeps the newest overall attempt score and maximum.
3. The API client exposes `overallScore`, `overallMaxScore`, and `gameScores` on `TeacherClassStudent`.
4. `TeacherStudentProgressTable` renders the overall score and an accessible expand/collapse control. Expanded rows render the catalog game title, score, percentage, and `--` for games with no recorded result.
5. Existing reports continue to use their selected-window aggregates and are not changed by this classroom-progress view.

## Score semantics

- “Overall” is the latest completed attempt’s stored `score / max_score`.
- Each game is the latest completed `attempt_game_results` row for that student and game.
- Results from incomplete attempts are excluded.
- Missing game results are displayed as `--`, not treated as zero.
- Existing completion percentages and report aggregates remain unchanged.

## Testing

- Add handler coverage proving latest overall and latest-per-game selection, including incomplete-attempt exclusion.
- Add component/source coverage proving the progress table renders overall scores and expandable game rows.
- Run the focused roster/report tests, typecheck, production build, and the full Deno test suite. Existing unrelated failures must be reported rather than hidden.
