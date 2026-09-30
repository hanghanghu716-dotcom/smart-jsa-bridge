create table if not exists public.user_work_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  detail text not null default '',
  analysis_data jsonb not null default '{"risks":[],"frequency":1,"severity":1,"riskLevel":1}'::jsonb,
  tags text[] not null default '{}'::text[],
  locale text not null default 'en-US',
  source_project_id uuid null references public.jsa_projects(id) on delete set null,
  source_step_index integer null check (source_step_index is null or source_step_index >= 0),
  source_project_title text null,
  is_favorite boolean not null default false,
  use_count bigint not null default 0 check (use_count >= 0),
  last_used_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_work_steps_user_updated_idx
  on public.user_work_steps (user_id, updated_at desc);
create index if not exists user_work_steps_user_last_used_idx
  on public.user_work_steps (user_id, last_used_at desc nulls last);
create index if not exists user_work_steps_source_project_idx
  on public.user_work_steps (source_project_id);
create index if not exists user_work_steps_tags_gin_idx
  on public.user_work_steps using gin (tags);

alter table public.user_work_steps enable row level security;

revoke all on table public.user_work_steps from anon;
grant select, insert, update, delete on table public.user_work_steps to authenticated;

create policy "Users can view own work steps"
  on public.user_work_steps
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own work steps"
  on public.user_work_steps
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own work steps"
  on public.user_work_steps
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own work steps"
  on public.user_work_steps
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.user_jsa_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled JSA',
  current_stage text not null default 'info'
    check (current_stage in ('info','procedure','analysis','module','table','export')),
  form_data jsonb not null default '{}'::jsonb,
  participants jsonb not null default '[]'::jsonb,
  procedures jsonb not null default '[]'::jsonb,
  analysis_data jsonb not null default '[]'::jsonb,
  layout_data jsonb not null default '{}'::jsonb,
  source_project_id uuid null references public.jsa_projects(id) on delete set null,
  is_archived boolean not null default false,
  version integer not null default 1 check (version >= 1),
  last_opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_jsa_drafts_user_updated_idx
  on public.user_jsa_drafts (user_id, updated_at desc);
create index if not exists user_jsa_drafts_user_active_idx
  on public.user_jsa_drafts (user_id, is_archived, updated_at desc);
create index if not exists user_jsa_drafts_source_project_idx
  on public.user_jsa_drafts (source_project_id);

alter table public.user_jsa_drafts enable row level security;

revoke all on table public.user_jsa_drafts from anon;
grant select, insert, update, delete on table public.user_jsa_drafts to authenticated;

create policy "Users can view own JSA drafts"
  on public.user_jsa_drafts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own JSA drafts"
  on public.user_jsa_drafts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own JSA drafts"
  on public.user_jsa_drafts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own JSA drafts"
  on public.user_jsa_drafts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
