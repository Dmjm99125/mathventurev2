alter table public.profiles
  add column if not exists first_name text,
  add column if not exists normalized_first_name text;

create index if not exists profiles_student_normalized_name_idx
  on public.profiles (normalized_last_name, normalized_first_name)
  where role = 'student'
    and normalized_last_name is not null
    and normalized_first_name is not null;
