-- MathVenture schema
-- All application tables are accessed ONLY through Supabase Edge Functions
-- (using the service role key). Row Level Security is enabled on every
-- table with NO policies, so PostgREST/direct client access via the anon
-- or authenticated JWT is denied by default -- the only way to read or
-- write app data is through an edge function.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row, carries the app-level role
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('student', 'teacher')),
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- classes: created by teachers, students join via a short join code
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.classes enable row level security;

create table if not exists public.class_students (
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

alter table public.class_students enable row level security;

-- ---------------------------------------------------------------------------
-- lessons: the game catalog. game_type selects which frontend game engine
-- component renders the lesson; config drives that engine.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- assignments: a lesson assigned by a teacher to a whole class or one student
-- ---------------------------------------------------------------------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  student_id uuid references public.profiles (id) on delete cascade,
  assigned_by uuid not null references public.profiles (id) on delete cascade,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  constraint assignments_target_check check (class_id is not null or student_id is not null)
);

alter table public.assignments enable row level security;

-- ---------------------------------------------------------------------------
-- attempts: a completed play-through of a lesson by a student
-- ---------------------------------------------------------------------------
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete set null,
  score integer not null,
  max_score integer not null,
  duration_seconds integer,
  completed_at timestamptz not null default now()
);

alter table public.attempts enable row level security;

create index if not exists attempts_student_idx on public.attempts (student_id, completed_at desc);
create index if not exists assignments_class_idx on public.assignments (class_id);
create index if not exists assignments_student_idx on public.assignments (student_id);
create index if not exists class_students_student_idx on public.class_students (student_id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever someone signs up. The role and
-- full_name are supplied as auth signup metadata (see the frontend signup
-- form): supabase.auth.signUp({ options: { data: { role, full_name } } }).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
