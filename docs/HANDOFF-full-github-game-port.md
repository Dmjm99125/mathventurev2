# MathVenture — Handoff: Full "Games from GitHub" Port

Written 2026-07-15. This document exists so work can continue outside the old
session. It captures the thesis
requirement, everything already built, the scope decision just made, and a
concrete plan for finishing the port.

## 1. What this project is

MathVenture is a bilingual (English/Filipino) jungle-themed early-childhood
math game, being rebuilt from a legacy static-HTML prototype
(`Dmjm99125/mathventureprototype`, reference build at
`https://mathventurev1.netlify.app/`) into a full-stack app with student and
teacher dashboards. This rebuild is the subject of the user's thesis — the
thesis's central claim is that **all of the original prototype's games are
faithfully reproduced**, so content fidelity matters more than usual.

## 2. Current state of the repo (already built, working)

- **Backend: Supabase**, not the monorepo's default Express/Drizzle stack.
  Project ref `pnylrdcrsjjovingigab`. Credentials live in Secrets:
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, plus `SESSION_SECRET`.
  See §5 for how to get the actual values — they are **not** reproduced here.
- **Access model**: every app table has RLS enabled with **no policies at
  all**. Only the service-role key (used exclusively inside Supabase Edge
  Functions) can read/write. This structurally enforces "all data access goes
  through edge functions" — the browser only ever talks to edge functions or
  to Supabase Auth directly (auth is the one exception, since it's the
  authorization system itself).
- **Edge functions** (`supabase/functions/*`, all deployed): `lessons-list`,
  `classes-list`, `classes-create`, `classes-join`, `classes-roster`,
  `assignments-list`, `assignments-create`, `attempts-submit`,
  `dashboard-student`, `dashboard-teacher`.
  - Deploy quirk: use `supabase functions deploy <name> --use-api` (Docker
    bundling has no network access in this sandbox). `supabase/config.toml`
    must **not** have a `[functions]` table (bare `verify_jwt` bool parses,
    the table form doesn't in this CLI version). Import
    `npm:@supabase/supabase-js@2`, not `jsr:`. Full detail in
    `.agents/memory/supabase-cli-env-quirks.md`.
  - `mailer_autoconfirm` was turned on via the Supabase Management API so
    signup doesn't block on email confirmation.
- **Schema**: `supabase/migrations/0001_init.sql` (tables: profiles, classes,
  class_members, lessons, assignments, attempts) and
  `0002_seed_lessons.sql` (lesson catalog seed).
- **Frontend**: `artifacts/mathventure/` — React/Vite app with landing page,
  login/signup, student dashboard/lesson map/game player, teacher
  dashboard/classes/roster/assignments, EN/TL language toggle.
  `src/lib/api.ts` / `auth.ts` / `useAuth.tsx` / `supabase.ts` wrap edge
  function calls and Supabase Auth.
- **What's superseded by this handoff**: the seed data currently only covers
  **3 of the 9 real curriculum chapters** (Colors, Shapes, Numbers), built as
  32 lessons across 3 invented game engines (`identify`, `match-pairs`,
  `sequence`). The user has rejected this as the final scope — it was a
  reasonable MVP but must expand to all 9 chapters, sourced faithfully from
  the original files, not reinterpreted from scratch.
- A full backend smoke test (signup → class create/join → assignment →
  attempt submit → both dashboards) has been run end-to-end against Supabase
  and passes as of this build.

## 3. The legacy prototype — structure (now mirrored into this repo)

The original 175 static HTML files (plus ~380 image/audio/video assets) have
been copied from `/tmp/mvp` into **`docs/legacy-prototype-reference/`** in
this repo, so they survive after this session ends. Do the actual content
extraction from those files — don't re-derive content from memory or from
the seed data already in `0002_seed_lessons.sql`, which only covers 3
chapters.

### Navigation shape

`index.html` → `1.html` (the **main chapter menu** — 9 rows, each an image
link to `<n>n.html`, one per chapter). Chapter topic images referenced there:
`1col.png` (Colors), `1sha.png` (Shapes), `1seq.png` (Sequencing),
`1add.png` (Addition), `1SUB.png` (Subtraction), `1NUM.png` (Numbers),
`1MEA.png` (Measurement), `1COM.png` (Comparison), `1CLO.png` (Telling Time).

Each chapter `<n>n.html` is a **bilingual flashcard/teaching page**: images
paired with an `1eng.png`/`1fil.png` icon and an `<audio>` tag with an
English or Filipino pronunciation clip. It then links into `<n>.html`, the
chapter's **quiz launcher**, which chains into lettered exercise pages
(`<n>a.html`, `<n>b.html`, ...). Many of those exercise pages are quiz
*questions* whose image options are click-links to either a `...cor.html`
(correct-feedback) or `...wr.html` / `...wr1.html` (wrong-feedback, often
per-wrong-option) page. Numbered suffixes within a letter group
(`1b1.html` … `1b11.html`) are separate questions inside that
exercise/sub-lesson. **Treat each `cor`/`wr` pair as feedback *states* of one
question, not as separate lessons** — this is what turns "175 raw files"
into a much smaller number of *distinct* playable lessons once reconstructed
properly.

### Per-chapter file inventory (in `docs/legacy-prototype-reference/`)

| # | Topic | Files matching `<n>*.html` | Notable structure |
|---|-------|------------------------------|--------------------|
| 1 | Colors | 50 | `1n.html` flashcards (9 colors × EN/TL audio); `1a`/`1aab`/`1ab` intro; `1b`, `1b1`–`1b11` are 12 quiz questions each with `cor`/`wr`/`wr1` feedback pages |
| 2 | Shapes | 7 | `2n.html` flashcards (8 shapes); `2a`–`2d`, `2c1` exercises |
| 3 | Sequencing | 8 | `3n.html` intro (counting sequence 0–10, alphabet, size ordering `sn1`-`sn5`); `3a`–`3f` exercises |
| 4 | Addition | 10 | `4n.html` intro; `4a`–`4e` exercises; `4d` has 3 variants (`4dn1`, `4dn2`, `4dnew`) — inspect which is actually linked-to/current before porting |
| 5 | Subtraction | 7 | `5n.html` intro; `5a`–`5e` exercises |
| 6 | Numbers | 8 | `6n.html`/`6n2.html` intro (two variants — check which is live); `6a`–`6e` exercises |
| 7 | Measurement | 6 | `7n.html` intro; `7a`–`7d` exercises |
| 8 | Comparison | 7 | `8n.html` intro; `8a`–`8e` exercises |
| 9 | Telling Time | 37 | `9n.html`/`9na`–`9nf` intro (clock faces `21o.png`…`212o.png` = 1 o'clock … 12 o'clock, each with its own audio); `9a`, `9ab`–`9af`, `9g`, `9h` exercises, several with `cor`/`wr1`/`wr2` (two wrong-answer variants) |

**Total: 140 files across these 9 chapters.** This is the "games from
GitHub" scope.

### Explicitly OUT OF SCOPE for this pass (confirmed with user)

The remaining ~35 files are **additional Lessons** — each follows a structured
flow of: **video → lesson proper → activities**. They are structurally unlike
the core curriculum quizzes (some use `<marquee>`, custom layouts, or look
like they need canvas/drag-drop interaction not visible from static markup
alone). **Skip these for now:**

```
arcade.html carni.html colgal.html dino.html dive.html fall.html farm.html
hip.html hol.html icecream.html labr.html liquid.html longer.html magic.html
mons.html pizza.html rcc.html rcd.html rocket.html scoop.html seqn.html
seqn2.html seqn3.html sesand.html sha1.html sha2.html shapeg.html
shaperacing.html snake.html space.html su1.html tiny.html toy.html
```
(`index.html` and `re.html` are navigation chrome, not games — also excluded.)

> **Correction note**: These were previously mislabeled as "Bonus Games" in
> an earlier draft. They are **Lessons**, each composed of three stages in
> sequence: (1) a video, (2) the lesson proper, and (3) activities. When
> these are eventually picked up, implement them as a distinct lesson category
> under the same Lesson model — NOT as a separate "bonus" classification.

## 4. Scope decision for "hardcoded" content going forward

Per the user's explicit direction, the lesson catalog going forward has
**two content categories**:

1. **"Games from GitHub"** — the 9 curriculum chapters above, ported
   faithfully from the original files (real bilingual audio, real images,
   real quiz questions/answers reconstructed from the actual link chains,
   not invented). This is the thesis's core deliverable and the priority.
2. **"Teacher's own games"** — custom teacher-authored content. **Do not
   build this now.** It should appear in the teacher dashboard as a
   disabled/greyed "Coming Soon" entry only (e.g. a card or nav item that
   communicates the feature exists but isn't available yet). Do not invent
   a data model for it beyond what's needed to render that placeholder.

## 5. Secrets / environment variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`
- `SESSION_SECRET`



## 6. Concrete next steps

1. For each of the 9 chapters, walk its link chain starting at `<n>.html`
   (already-copied files in `docs/legacy-prototype-reference/`) and
   reconstruct, per question: the prompt image/audio, the option images
   presented, which option is correct, and what `cor`/`wr` feedback shows.
   Where a chapter has ambiguous duplicate variants (`4d` vs `4dn1`/`4dn2`/
   `4dnew`; `6n` vs `6n2`), trace inbound links to determine which is the
   live/current version before using it as source of truth.
2. Extend `supabase/migrations/0002_seed_lessons.sql` (or a new migration)
   with the full reconstructed catalog for all 9 chapters. Consider whether
   the existing 3-engine model (`identify`/`match-pairs`/`sequence`) can
   represent chapters 4–9's content (addition/subtraction arithmetic,
   measurement comparison, clock-reading) or whether new `game_type` values
   /generic question-and-options JSON shape are needed — the clock-reading
   and arithmetic chapters likely don't fit the existing 3 engines as-is.
3. Copy the real per-chapter assets (images + `.mp3`/`.ogg` audio) from
   `docs/legacy-prototype-reference/` into
   `artifacts/mathventure/public/assets/<chapter>/`, matching the pattern
   already used for colors/shapes/numbers.
4. Extend the frontend game engine/lesson map to render the newly-added
   chapters and game types.
5. Add the "Teacher's own games — Coming Soon" placeholder in the teacher
   dashboard.
6. Re-run the end-to-end smoke test (signup → play a lesson from each new
   chapter → dashboards) after the catalog expands.

Suggested architecture:
src/
├── assets/
│   ├── audio/
│   └── images/
├── components/
│   ├── GameLayout.tsx
│   ├── LessonCard.tsx
│   ├── QuestionCard.tsx
│   ├── AnswerOption.tsx
│   ├── FeedbackModal.tsx
│   └── AudioButton.tsx
├── data/
│   ├── counting.ts
│   ├── shapes.ts
│   ├── sequencing.ts
│   ├── addition.ts
│   ├── subtraction.ts
│   ├── numbers.ts
│   ├── measurement.ts
│   ├── comparison.ts
│   └── clock.ts
├── pages/
│   ├── HomePage.tsx
│   ├── TopicsPage.tsx
│   ├── LessonPage.tsx
│   └── QuizPage.tsx
├── router/
│   └── AppRouter.tsx
└── App.tsx