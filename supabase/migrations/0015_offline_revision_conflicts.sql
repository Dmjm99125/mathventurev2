alter table public.offline_sync_operations
  add column if not exists base_revision bigint not null default 0,
  add column if not exists result_status text not null default 'pending',
  add column if not exists conflict_payload jsonb,
  add column if not exists server_revision bigint,
  add column if not exists server_entity_id text;

create index if not exists offline_sync_operations_result_idx
  on public.offline_sync_operations (teacher_id, result_status, created_at desc);

create table if not exists public.offline_entity_id_mappings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  device_id text not null,
  entity_type text not null,
  local_id text not null,
  server_id text not null,
  created_at timestamptz not null default now(),
  unique (teacher_id, device_id, entity_type, local_id),
  unique (teacher_id, device_id, entity_type, server_id)
);

alter table public.offline_entity_id_mappings enable row level security;

create index if not exists offline_entity_id_mappings_teacher_idx
  on public.offline_entity_id_mappings (teacher_id, device_id, entity_type, created_at desc);
