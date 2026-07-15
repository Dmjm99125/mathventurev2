-- ---------------------------------------------------------------------------
-- class_posts: posts and announcements created by teachers for a class
-- ---------------------------------------------------------------------------
create table if not exists public.class_posts (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.class_posts enable row level security;

create index if not exists class_posts_class_idx on public.class_posts (class_id);
create index if not exists class_posts_created_idx on public.class_posts (created_at desc);
