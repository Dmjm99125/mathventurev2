-- Recovery migration for the lesson catalog dropped on 2026-07-29.
--
-- This reconstructs a usable `public.lessons` table from the current
-- hardcoded lesson catalog and preserves the one known orphaned legacy UUID
-- as a placeholder row so historical references are not left completely
-- contextless.
--
-- IMPORTANT:
-- - This does NOT restore the original dropped lesson rows.
-- - The legacy UUID `3e1bd34f-1035-44b0-9b57-b35d385db7f6` could not be
--   mapped back to its original slug from surviving database evidence alone.
-- - Keep that placeholder row until a human can confirm the original topic.

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  topic text not null,
  title text not null,
  description text not null default '',
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  game_type text not null check (game_type in ('identify', 'match-pairs', 'sequence')),
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;

insert into public.lessons (
  id,
  slug,
  topic,
  title,
  description,
  difficulty,
  game_type,
  config,
  sort_order
)
values
  (
    '13b5eb5b-a296-4d0b-8a5a-68c2410c0a01',
    'colors',
    'colors',
    'Colors',
    'Reconstructed from the hardcoded lesson catalog.',
    'easy',
    'identify',
    '{}'::jsonb,
    1
  ),
  (
    '13b5eb5b-a296-4d0b-8a5a-68c2410c0a02',
    'shapes',
    'shapes',
    'Shapes',
    'Reconstructed from the hardcoded lesson catalog.',
    'easy',
    'match-pairs',
    '{}'::jsonb,
    2
  ),
  (
    '13b5eb5b-a296-4d0b-8a5a-68c2410c0a03',
    'sequencing',
    'sequencing',
    'Sequencing',
    'Reconstructed from the hardcoded lesson catalog.',
    'easy',
    'sequence',
    '{}'::jsonb,
    3
  ),
  (
    '13b5eb5b-a296-4d0b-8a5a-68c2410c0a04',
    'addition',
    'addition',
    'Addition',
    'Reconstructed from the hardcoded lesson catalog.',
    'easy',
    'identify',
    '{}'::jsonb,
    4
  ),
  (
    '13b5eb5b-a296-4d0b-8a5a-68c2410c0a05',
    'subtraction',
    'subtraction',
    'Subtraction',
    'Reconstructed from the hardcoded lesson catalog.',
    'easy',
    'identify',
    '{}'::jsonb,
    5
  ),
  (
    '13b5eb5b-a296-4d0b-8a5a-68c2410c0a06',
    'numbers',
    'numbers',
    'Numbers',
    'Reconstructed from the hardcoded lesson catalog.',
    'easy',
    'identify',
    '{}'::jsonb,
    6
  ),
  (
    '13b5eb5b-a296-4d0b-8a5a-68c2410c0a07',
    'measurement',
    'measurement',
    'Measurement',
    'Reconstructed from the hardcoded lesson catalog.',
    'easy',
    'identify',
    '{}'::jsonb,
    7
  ),
  (
    '13b5eb5b-a296-4d0b-8a5a-68c2410c0a08',
    'comparison',
    'comparison',
    'Comparison',
    'Reconstructed from the hardcoded lesson catalog.',
    'easy',
    'identify',
    '{}'::jsonb,
    8
  ),
  (
    '13b5eb5b-a296-4d0b-8a5a-68c2410c0a09',
    'clock',
    'clock',
    'Clock',
    'Reconstructed from the hardcoded lesson catalog.',
    'easy',
    'identify',
    '{}'::jsonb,
    9
  ),
  (
    '3e1bd34f-1035-44b0-9b57-b35d385db7f6',
    'legacy-unmapped-3e1bd34f',
    'legacy',
    'Recovered Legacy Lesson (Unmapped)',
    'Placeholder for the pre-hardcoded lesson row lost when public.lessons was dropped on 2026-07-29. Original slug could not be recovered from surviving remote evidence alone. Historical context: assignment and attempt in Kinder A / Test Student on 2026-07-15 around 09:29 UTC.',
    'easy',
    'identify',
    '{}'::jsonb,
    999
  )
on conflict (id) do update
set
  slug = excluded.slug,
  topic = excluded.topic,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  game_type = excluded.game_type,
  config = excluded.config,
  sort_order = excluded.sort_order;
