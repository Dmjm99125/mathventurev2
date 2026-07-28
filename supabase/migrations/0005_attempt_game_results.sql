create table if not exists public.attempt_game_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic_id text not null,
  game_id text not null,
  game_order integer not null check (game_order >= 0),
  score integer not null,
  max_score integer not null check (max_score > 0),
  score_pct integer not null check (score_pct between 0 and 100),
  passed boolean not null,
  completed_at timestamptz not null default now()
);

alter table public.attempt_game_results enable row level security;

create index if not exists attempt_game_results_student_completed_idx
  on public.attempt_game_results (student_id, completed_at desc);

create index if not exists attempt_game_results_student_game_idx
  on public.attempt_game_results (student_id, game_id, passed);
