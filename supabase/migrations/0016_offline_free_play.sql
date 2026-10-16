create table if not exists public.free_play_sessions (
  id uuid primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer,
  max_score integer,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.free_play_sessions enable row level security;

create index if not exists free_play_sessions_profile_idx
  on public.free_play_sessions (profile_id, updated_at desc);

create table if not exists public.free_play_progress (
  id uuid primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null,
  best_score integer not null default 0,
  best_max_score integer not null default 0,
  play_count integer not null default 0,
  last_played_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, game_id)
);

alter table public.free_play_progress enable row level security;

create index if not exists free_play_progress_profile_idx
  on public.free_play_progress (profile_id, updated_at desc);

delete from public.attempt_game_results duplicate
using public.attempt_game_results keeper
where duplicate.attempt_id = keeper.attempt_id
  and duplicate.game_id = keeper.game_id
  and duplicate.ctid < keeper.ctid;

create unique index if not exists attempt_game_results_attempt_game_idx
  on public.attempt_game_results (attempt_id, game_id);
