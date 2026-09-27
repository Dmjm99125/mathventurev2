-- Query-performance indexes and service-role aggregate functions.
-- These functions intentionally return bounded summaries instead of raw
-- attempt history so Edge Functions do not materialize entire classrooms.

create index if not exists classes_teacher_created_idx
  on public.classes (teacher_id, created_at, id);

create index if not exists class_students_class_joined_idx
  on public.class_students (class_id, joined_at, student_id);

create index if not exists assignments_class_created_idx
  on public.assignments (class_id, created_at desc, id desc);

create index if not exists assignments_student_created_idx
  on public.assignments (student_id, created_at desc, id desc);

create index if not exists attempts_class_student_status_completed_idx
  on public.attempts (class_id, student_id, status, completed_at desc, id desc);

create index if not exists attempts_assignment_student_updated_idx
  on public.attempts (assignment_id, student_id, updated_at desc, id desc);

create index if not exists attempt_game_results_attempt_completed_idx
  on public.attempt_game_results (attempt_id, completed_at desc, game_id);

create index if not exists attempt_game_results_student_completed_game_idx
  on public.attempt_game_results (student_id, completed_at desc, game_id);

create or replace function public.get_teacher_dashboard_summary(p_teacher_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with teacher_class as (
  select id, name
  from public.classes
  where teacher_id = p_teacher_id
  order by created_at asc, id asc
  limit 1
),
enrolled as (
  select cs.class_id, cs.student_id
  from public.class_students cs
  join teacher_class tc on tc.id = cs.class_id
),
completed_attempts as (
  select a.student_id, a.lesson_id, a.score, a.max_score
  from public.attempts a
  join enrolled e on e.student_id = a.student_id and e.class_id = a.class_id
  where a.status = 'completed'
),
class_summary as (
  select
    tc.id,
    tc.name,
    (select count(*) from enrolled)::integer as student_count,
    count(ca.*)::integer as attempt_count,
    case
      when sum(ca.max_score) > 0
        then round(sum(ca.score)::numeric / sum(ca.max_score)::numeric * 100)::integer
      else null
    end as average_score_pct
  from teacher_class tc
  left join completed_attempts ca on true
  group by tc.id, tc.name
),
lesson_summary as (
  select
    lesson_id,
    count(*)::integer as attempts,
    round(sum(score)::numeric / nullif(sum(max_score), 0)::numeric * 100)::integer as average_score_pct
  from completed_attempts
  group by lesson_id
  order by average_score_pct asc, lesson_id asc
  limit 5
)
select jsonb_build_object(
  'classCount', (select count(*)::integer from teacher_class),
  'studentCount', (select count(*)::integer from enrolled),
  'classes', coalesce(
    (select jsonb_agg(jsonb_build_object(
      'id', id,
      'name', name,
      'studentCount', student_count,
      'attemptCount', attempt_count,
      'averageScorePct', average_score_pct
    ) order by id) from class_summary),
    '[]'::jsonb
  ),
  'strugglingLessons', coalesce(
    (select jsonb_agg(jsonb_build_object(
      'lessonId', lesson_id,
      'attempts', attempts,
      'averageScorePct', average_score_pct
    ) order by average_score_pct asc, lesson_id asc) from lesson_summary),
    '[]'::jsonb
  )
);
$$;

create or replace function public.get_student_dashboard_summary(
  p_student_id uuid,
  p_recent_limit integer default 20
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with params as (
  select least(greatest(coalesce(p_recent_limit, 20), 1), 100)::integer as recent_limit
),
completed_attempts as (
  select lesson_id, score, max_score, completed_at
  from public.attempts
  where student_id = p_student_id
    and status = 'completed'
),
activity_days as (
  select distinct (completed_at at time zone 'UTC')::date as activity_day
  from completed_attempts
),
first_gap as (
  select coalesce(min(day_offset), 3661)::integer as day_offset
  from generate_series(0, 3660) as offsets(day_offset)
  where not exists (
    select 1
    from activity_days
    where activity_day = (current_date - offsets.day_offset)
  )
),
recent_attempts as (
  select lesson_id, score, max_score, completed_at
  from completed_attempts
  order by completed_at desc nulls last
  limit (select recent_limit from params)
)
select jsonb_build_object(
  'completedLessons', (select count(distinct lesson_id)::integer from completed_attempts),
  'streakDays', (select day_offset from first_gap),
  'recentAttempts', coalesce(
    (select jsonb_agg(jsonb_build_object(
      'lessonId', lesson_id,
      'score', score,
      'maxScore', max_score,
      'completedAt', completed_at
    ) order by completed_at desc nulls last) from recent_attempts),
    '[]'::jsonb
  )
);
$$;

create or replace function public.get_teacher_report_summary(
  p_teacher_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_student_limit integer default 50,
  p_student_cursor uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with params as (
  select least(greatest(coalesce(p_student_limit, 50), 1), 100)::integer as student_limit
),
teacher_class as (
  select id
  from public.classes
  where teacher_id = p_teacher_id
  order by created_at asc, id asc
  limit 1
),
enrolled as (
  select
    cs.class_id,
    cs.student_id,
    cs.joined_at,
    p.full_name,
    coalesce(p.first_name, p.full_name) as first_name,
    p.last_name
  from public.class_students cs
  join teacher_class tc on tc.id = cs.class_id
  join public.profiles p on p.id = cs.student_id
),
window_results as (
  select
    a.student_id,
    a.class_id,
    agr.topic_id,
    agr.game_id,
    agr.game_order,
    agr.score,
    agr.max_score,
    agr.score_pct,
    agr.passed,
    agr.completed_at
  from public.attempts a
  join teacher_class tc on tc.id = a.class_id
  join enrolled e on e.student_id = a.student_id and e.class_id = a.class_id
  join public.attempt_game_results agr
    on agr.attempt_id = a.id
   and agr.student_id = a.student_id
  where a.status = 'completed'
    and agr.completed_at >= greatest(coalesce(p_start_at, '-infinity'::timestamptz), e.joined_at)
    and agr.completed_at <= coalesce(p_end_at, 'infinity'::timestamptz)
),
student_metrics as (
  select
    e.student_id,
    e.full_name,
    e.first_name,
    e.last_name,
    count(wr.game_id)::integer as result_count,
    case
      when sum(wr.max_score) > 0
        then round(sum(wr.score)::numeric / sum(wr.max_score)::numeric * 100)::integer
      else null
    end as average_score_pct,
    case
      when count(wr.game_id) = 0 then 0
      else round(count(distinct wr.game_id) filter (where wr.passed)::numeric / 80 * 100)::integer
    end as completion_pct,
    (array_agg(wr.score_pct order by wr.completed_at desc nulls last))[1] as last_played_pct,
    max(wr.completed_at) as last_activity_at
  from enrolled e
  left join window_results wr on wr.student_id = e.student_id
  group by e.student_id, e.full_name, e.first_name, e.last_name
),
student_page as (
  select sm.*
  from student_metrics sm
  where p_student_cursor is null or sm.student_id > p_student_cursor
  order by sm.student_id asc
  limit ((select student_limit from params) + 1)
),
topic_metrics as (
  select
    topic_id,
    case
      when sum(max_score) > 0
        then round(sum(score)::numeric / sum(max_score)::numeric * 100)::integer
      else null
    end as average_score_pct,
    count(*) filter (where passed)::integer as pass_count,
    count(*)::integer as attempt_count
  from window_results
  group by topic_id
),
game_metrics as (
  select
    topic_id,
    game_id,
    game_order,
    case
      when sum(max_score) > 0
        then round(sum(score)::numeric / sum(max_score)::numeric * 100)::integer
      else null
    end as average_score_pct,
    count(*) filter (where passed)::integer as pass_count,
    count(*)::integer as attempt_count,
    max(completed_at) as last_played_at
  from window_results
  group by topic_id, game_id, game_order
),
topic_json as (
  select
    tm.topic_id,
    tm.average_score_pct,
    tm.pass_count,
    tm.attempt_count,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'gameId', gm.game_id,
          'gameOrder', gm.game_order,
          'title', gm.game_id,
          'averageScorePct', gm.average_score_pct,
          'passCount', gm.pass_count,
          'attemptCount', gm.attempt_count,
          'lastPlayedAt', gm.last_played_at
        ) order by gm.game_order asc)
        from game_metrics gm
        where gm.topic_id = tm.topic_id
      ),
      '[]'::jsonb
    ) as games
  from topic_metrics tm
),
class_metrics as (
  select
    (select count(*)::integer from enrolled) as student_count,
    (select count(distinct student_id)::integer from window_results) as active_student_count,
    case
      when sum(wr.max_score) > 0
        then round(sum(wr.score)::numeric / sum(wr.max_score)::numeric * 100)::integer
      else null
    end as average_score_pct,
    coalesce((select round(avg(completion_pct))::integer from student_metrics), 0) as completion_pct,
    max(wr.completed_at) as last_activity_at
  from window_results wr
),
student_row_page as (
  select sp.*
  from student_page sp
  order by sp.student_id asc
  limit (select student_limit from params)
),
attention_rows as (
  select
    sm.student_id,
    sm.full_name,
    sm.first_name,
    sm.last_name,
    sm.average_score_pct,
    sm.completion_pct,
    array_remove(array[
      case when sm.average_score_pct is not null and sm.average_score_pct < 75 then 'low_average' end,
      case when sm.result_count = 0 and exists (select 1 from window_results) then 'inactive_while_class_active' end,
      case when sm.completion_pct < 10 then 'low_completion' end
    ], null) as reason_codes
  from student_metrics sm
  where (
    (sm.average_score_pct is not null and sm.average_score_pct < 75)
    or (sm.result_count = 0 and exists (select 1 from window_results))
    or sm.completion_pct < 10
  )
  order by cardinality(array_remove(array[
    case when sm.average_score_pct is not null and sm.average_score_pct < 75 then 'low_average' end,
    case when sm.result_count = 0 and exists (select 1 from window_results) then 'inactive_while_class_active' end,
    case when sm.completion_pct < 10 then 'low_completion' end
  ], null)) desc, sm.average_score_pct nulls first, sm.student_id asc
  limit 100
),
recent_passes as (
  select
    wr.student_id,
    e.full_name,
    wr.game_id,
    wr.completed_at,
    wr.score_pct
  from window_results wr
  join enrolled e on e.student_id = wr.student_id
  where wr.passed
  order by wr.completed_at desc
  limit 5
),
page_meta as (
  select
    count(*) > (select student_limit from params) as has_more,
    case
      when count(*) > (select student_limit from params)
        then (array_agg(student_id order by student_id asc))[ (select student_limit from params) ]
      else null
    end as next_cursor
  from student_page
)
select jsonb_build_object(
  'classroom', jsonb_build_object(
    'id', (select id from teacher_class),
    'studentCount', coalesce((select student_count from class_metrics), 0),
    'activeStudentCount', coalesce((select active_student_count from class_metrics), 0),
    'averageScorePct', (select average_score_pct from class_metrics),
    'completionPct', coalesce((select completion_pct from class_metrics), 0),
    'lastActivityAt', (select last_activity_at from class_metrics)
  ),
  'attentionStudents', coalesce(
    (select jsonb_agg(jsonb_build_object(
      'studentId', student_id,
      'fullName', full_name,
      'firstName', first_name,
      'lastName', last_name,
      'averageScorePct', average_score_pct,
      'completionPct', completion_pct,
      'reasonCodes', reason_codes
    )) from attention_rows),
    '[]'::jsonb
  ),
  'recentActivity', jsonb_build_object(
    'recentPasses', coalesce(
      (select jsonb_agg(jsonb_build_object(
        'studentId', student_id,
        'fullName', full_name,
        'gameId', game_id,
        'gameTitle', game_id,
        'completedAt', completed_at,
        'scorePct', score_pct
      ) order by completed_at desc) from recent_passes),
      '[]'::jsonb
    ),
    'lastPlayedAt', (select last_activity_at from class_metrics),
    'inactiveStudentCount', (
      select count(*)::integer from student_metrics where result_count = 0
    )
  ),
  'studentRows', coalesce(
    (select jsonb_agg(jsonb_build_object(
      'studentId', student_id,
      'fullName', full_name,
      'firstName', first_name,
      'lastName', last_name,
      'averageScorePct', average_score_pct,
      'completionPct', completion_pct,
      'lastPlayedPct', last_played_pct,
      'lastActivityAt', last_activity_at
    ) order by student_id asc) from student_row_page),
    '[]'::jsonb
  ),
  'topicBreakdown', coalesce(
    (select jsonb_agg(jsonb_build_object(
      'topicId', topic_id,
      'averageScorePct', average_score_pct,
      'passCount', pass_count,
      'attemptCount', attempt_count,
      'games', games
    ) order by topic_id asc) from topic_json),
    '[]'::jsonb
  ),
  'page', jsonb_build_object(
    'nextCursor', (select next_cursor from page_meta),
    'hasMore', coalesce((select has_more from page_meta), false)
  )
);
$$;

revoke all on function public.get_teacher_dashboard_summary(uuid) from public, anon, authenticated;
grant execute on function public.get_teacher_dashboard_summary(uuid) to service_role;

revoke all on function public.get_student_dashboard_summary(uuid, integer) from public, anon, authenticated;
grant execute on function public.get_student_dashboard_summary(uuid, integer) to service_role;

revoke all on function public.get_teacher_report_summary(uuid, timestamptz, timestamptz, integer, uuid) from public, anon, authenticated;
grant execute on function public.get_teacher_report_summary(uuid, timestamptz, timestamptz, integer, uuid) to service_role;
