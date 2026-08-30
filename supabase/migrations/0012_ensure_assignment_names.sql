-- Keep deployed databases compatible with named classroom assignments.
alter table public.assignments
  add column if not exists name text not null default '';
