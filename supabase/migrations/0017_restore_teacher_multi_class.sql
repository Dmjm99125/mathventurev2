alter table public.classes
  add column if not exists archived_at timestamptz;

drop index if exists public.classes_teacher_singleton_idx;

create index if not exists classes_teacher_archive_created_idx
  on public.classes (teacher_id, archived_at, created_at, id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  next_role text;
begin
  next_role := coalesce(new.raw_user_meta_data ->> 'role', 'student');

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    next_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  if next_role = 'teacher' and not exists (
    select 1
    from public.classes
    where classes.teacher_id = new.id
  ) then
    insert into public.classes (teacher_id, name, join_code)
    values (new.id, 'Classroom', null);
  end if;

  return new;
end;
$function$;
