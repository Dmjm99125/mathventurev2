alter table public.assignments
  add column if not exists name text not null default '';
