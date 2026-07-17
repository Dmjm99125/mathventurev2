alter table public.profiles
  add column if not exists lrn text,
  add column if not exists normalized_lrn text,
  add column if not exists last_name text,
  add column if not exists normalized_last_name text;

create unique index if not exists profiles_student_normalized_lrn_uidx
  on public.profiles (normalized_lrn)
  where role = 'student' and normalized_lrn is not null;

create index if not exists profiles_student_normalized_last_name_idx
  on public.profiles (normalized_last_name)
  where role = 'student' and normalized_last_name is not null;
