do $$
begin
  if exists (
    select 1
    from public.classes
    group by teacher_id
    having count(*) > 1
  ) then
    raise exception
      'single teacher classroom migration aborted: at least one teacher already owns multiple classes';
  end if;
end
$$;

alter table public.classes
  alter column join_code drop not null;

create unique index if not exists classes_teacher_singleton_idx
  on public.classes (teacher_id);

insert into public.classes (teacher_id, name, join_code)
select
  profiles.id,
  'Classroom',
  null
from public.profiles
where profiles.role = 'teacher'
  and not exists (
    select 1
    from public.classes
    where classes.teacher_id = profiles.id
  );

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

  if next_role = 'teacher' then
    insert into public.classes (teacher_id, name, join_code)
    values (new.id, 'Classroom', null)
    on conflict (teacher_id) do nothing;
  end if;

  return new;
end;
$function$;
