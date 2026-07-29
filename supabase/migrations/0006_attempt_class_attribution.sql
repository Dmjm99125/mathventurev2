alter table public.attempts
  add column if not exists class_id uuid references public.classes (id) on delete set null;

update public.attempts
set class_id = assignments.class_id
from public.assignments
where attempts.assignment_id = assignments.id
  and attempts.class_id is null
  and assignments.class_id is not null;

create index if not exists attempts_student_class_completed_idx
  on public.attempts (student_id, class_id, completed_at desc);
