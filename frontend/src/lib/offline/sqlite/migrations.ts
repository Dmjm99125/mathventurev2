export const SQLITE_DATABASE_NAME = 'mathventure-app';

export type SqlMigration = {
  version: number;
  name: string;
  statements: readonly string[];
};

const initialSchemaStatements = [
  `create table if not exists schema_migrations (
    version integer primary key,
    name text not null,
    applied_at text not null
  )`,
  `create table if not exists app_meta (
    key text primary key,
    value text not null,
    updated_at text not null
  )`,
  `create table if not exists device_enrollment (
    device_id text primary key,
    teacher_id text not null,
    profile_json text not null,
    verifier_json text not null,
    last_online_validated_at text not null,
    offline_access_until text not null,
    created_at text not null,
    updated_at text not null
  )`,
  `create table if not exists local_sessions (
    session_id text primary key,
    teacher_id text not null,
    active_profile_json text not null,
    viewing_student_json text,
    updated_at text not null
  )`,
  `create table if not exists profiles (
    id text primary key,
    role text not null check (role in ('teacher', 'student')),
    full_name text not null,
    email text,
    data_json text not null default '{}',
    server_revision integer not null default 0,
    is_deleted integer not null default 0,
    updated_at text not null
  )`,
  `create table if not exists classrooms (
    id text primary key,
    teacher_id text not null,
    name text not null,
    data_json text not null default '{}',
    server_revision integer not null default 0,
    is_deleted integer not null default 0,
    updated_at text not null
  )`,
  `create table if not exists class_students (
    student_id text primary key,
    class_id text not null,
    profile_json text not null,
    data_json text not null default '{}',
    server_revision integer not null default 0,
    is_deleted integer not null default 0,
    updated_at text not null
  )`,
  `create table if not exists assignments (
    id text primary key,
    class_id text,
    student_id text,
    lesson_id text not null,
    name text not null,
    due_at text,
    assigned_by text,
    data_json text not null default '{}',
    server_revision integer not null default 0,
    is_deleted integer not null default 0,
    updated_at text not null
  )`,
  `create table if not exists attempts (
    id text primary key,
    student_id text not null,
    assignment_id text,
    class_id text,
    lesson_id text not null,
    status text not null default 'completed',
    current_game_order integer not null default 0,
    score real not null default 0,
    max_score real not null default 0,
    completed_at text,
    data_json text not null default '{}',
    server_revision integer not null default 0,
    is_deleted integer not null default 0,
    updated_at text not null
  )`,
  `create table if not exists attempt_game_results (
    id text primary key,
    attempt_id text not null,
    student_id text not null,
    topic_id text not null,
    game_id text not null,
    game_order integer not null,
    score real not null,
    max_score real not null,
    completed_at text,
    data_json text not null default '{}',
    server_revision integer not null default 0,
    is_deleted integer not null default 0,
    updated_at text not null,
    unique (attempt_id, game_id)
  )`,
  `create table if not exists posts (
    id text primary key,
    class_id text not null,
    author_id text not null,
    content text not null,
    data_json text not null default '{}',
    server_revision integer not null default 0,
    is_deleted integer not null default 0,
    updated_at text not null
  )`,
  `create table if not exists free_play_sessions (
    id text primary key,
    profile_id text,
    game_id text not null,
    started_at text not null,
    completed_at text,
    data_json text not null default '{}',
    server_revision integer not null default 0,
    is_deleted integer not null default 0,
    updated_at text not null
  )`,
  `create table if not exists free_play_progress (
    id text primary key,
    profile_id text,
    game_id text not null,
    best_score real not null default 0,
    best_max_score real not null default 0,
    play_count integer not null default 0,
    last_played_at text,
    data_json text not null default '{}',
    server_revision integer not null default 0,
    is_deleted integer not null default 0,
    updated_at text not null,
    unique (profile_id, game_id)
  )`,
  `create table if not exists sync_outbox (
    operation_id text primary key,
    device_id text not null,
    actor_id text not null,
    operation_type text not null,
    entity_id text not null,
    payload_json text not null,
    dependencies_json text not null default '[]',
    base_revision integer not null default 0,
    created_at text not null,
    status text not null check (status in ('pending', 'syncing', 'failed')),
    attempt_count integer not null default 0,
    last_error text,
    next_attempt_at text
  )`,
  `create table if not exists sync_conflicts (
    conflict_id text primary key,
    operation_id text not null,
    entity_type text not null,
    entity_id text not null,
    local_json text not null,
    server_json text not null,
    message text not null,
    status text not null check (status in ('open', 'resolved')),
    created_at text not null,
    resolved_at text
  )`,
  `create table if not exists entity_id_mappings (
    entity_type text not null,
    local_id text not null,
    server_id text not null,
    created_at text not null,
    primary key (entity_type, local_id),
    unique (entity_type, server_id)
  )`,
  'create index if not exists profiles_role_idx on profiles(role)',
  'create index if not exists class_students_class_idx on class_students(class_id, is_deleted)',
  'create index if not exists assignments_class_idx on assignments(class_id, is_deleted, due_at)',
  'create index if not exists attempts_student_assignment_idx on attempts(student_id, assignment_id, updated_at)',
  'create index if not exists attempt_game_results_attempt_idx on attempt_game_results(attempt_id, game_order)',
  'create index if not exists posts_class_idx on posts(class_id, updated_at)',
  'create index if not exists free_play_progress_profile_game_idx on free_play_progress(profile_id, game_id)',
  'create index if not exists sync_outbox_status_created_at_idx on sync_outbox(status, created_at)',
  'create index if not exists sync_outbox_entity_idx on sync_outbox(entity_id, created_at)',
  'create index if not exists sync_conflicts_status_created_at_idx on sync_conflicts(status, created_at)',
] as const;

export const SQLITE_MIGRATIONS: readonly SqlMigration[] = [
  {
    version: 1,
    name: 'initial_application_schema',
    statements: initialSchemaStatements,
  },
];

export const SQLITE_SCHEMA_VERSION = SQLITE_MIGRATIONS.at(-1)?.version ?? 0;
