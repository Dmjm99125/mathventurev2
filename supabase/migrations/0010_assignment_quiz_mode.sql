-- Assignment quizzes use the existing attempts table as a resumable,
-- server-owned state machine. Historical rows remain completed attempts.
alter table public.attempts
  add column if not exists status text not null default 'completed',
  add column if not exists quiz_mode boolean not null default false,
  add column if not exists current_game_order integer not null default 0,
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.attempts
  drop constraint if exists attempts_status_check;

alter table public.attempts
  add constraint attempts_status_check
  check (status in ('in_progress', 'completed'));

alter table public.attempts
  drop constraint if exists attempts_current_game_order_check;

alter table public.attempts
  add constraint attempts_current_game_order_check
  check (current_game_order >= 0);

create index if not exists attempts_assignment_student_idx
  on public.attempts (assignment_id, student_id, updated_at desc);

-- Legacy assigned attempts retain quiz_mode=false so historical duplicates do
-- not make this migration destructive. New quiz rows are unique per student
-- and assignment; the API also checks all historical rows before starting.
create unique index if not exists attempts_new_quiz_unique_idx
  on public.attempts (student_id, assignment_id)
  where quiz_mode = true and assignment_id is not null;

create unique index if not exists attempt_game_results_attempt_game_unique_idx
  on public.attempt_game_results (attempt_id, game_id);

create or replace function public.set_attempt_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists attempts_set_updated_at on public.attempts;
create trigger attempts_set_updated_at
  before update on public.attempts
  for each row execute function public.set_attempt_updated_at();
