# Lessons Recovery Forensics

Date: 2026-07-29
Project: `pnylrdcrsjjovingigab`

## What was verified

- Verified applied remote migrations: `0001` through `0007`.
- `0007_update_schema_for_hardcoded.sql` dropped `public.lessons`.
- `public.lessons` now returns `404` through PostgREST.
- `supabase backups list --project-ref pnylrdcrsjjovingigab` returned:
  - `backups: null`
  - `pitr_enabled: false`
- `attempt_game_results` is empty in the current remote snapshot.

## Snapshot

The surviving public-table state was exported to:

- [remote snapshot folder](C:/Users/Adriaan%20M.%20Dimate/Desktop/development/personal/mathventure/.codex/tmp/remote-snapshot-2026-07-29)

## Surviving lesson-id state

Most surviving `attempts.lesson_id` and `assignments.lesson_id` values are already text slugs:

- `colors`
- `shapes`
- `sequencing`
- `subtraction`
- `measurement`
- `comparison`
- `clock`

## The unresolved orphan

One legacy lesson UUID still exists in live data:

- `3e1bd34f-1035-44b0-9b57-b35d385db7f6`

It appears in:

- `assignments.id = a7d09e89-dff3-4a4a-9155-e74ad158cef4`
- `attempts.id = 6d394c70-bf65-4a38-b31a-d0a97f0f42fb`

Known context:

- Class: `Kinder A`
- Teacher: `Test Teacher`
- Student: `Test Student`
- Assignment timestamp: `2026-07-15T09:29:37.055999+00:00`
- Attempt timestamp: `2026-07-15T09:29:39.927917+00:00`
- Attempt score: `8 / 10`
- Attempt duration: `42` seconds

## What cannot be proven from surviving evidence

- The original slug/title/topic behind `3e1bd34f-1035-44b0-9b57-b35d385db7f6`
- The original contents of the dropped `public.lessons` rows

## Prepared repair artifact

A recovery migration was prepared at:

- [0008_restore_lessons_catalog.sql](C:/Users/Adriaan%20M.%20Dimate/Desktop/development/personal/mathventure/supabase/migrations/0008_restore_lessons_catalog.sql)

That file is prepared locally and not yet applied remotely.

It:

- recreates `public.lessons`
- seeds the current hardcoded lesson catalog
- preserves the orphaned UUID as a placeholder row instead of guessing its topic
