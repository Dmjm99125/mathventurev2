create table if not exists public.offline_sync_operations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  device_id text not null,
  operation_id text not null,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  operation_type text not null,
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('applied', 'rejected')),
  result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  unique (device_id, operation_id)
);

alter table public.offline_sync_operations enable row level security;

create index if not exists offline_sync_operations_teacher_idx
  on public.offline_sync_operations (teacher_id, created_at desc);
