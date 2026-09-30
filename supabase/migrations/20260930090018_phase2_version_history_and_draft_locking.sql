alter table public.user_work_steps
  add column if not exists version integer not null default 1
  check (version >= 1);

create table if not exists public.user_work_step_versions (
  id uuid primary key default gen_random_uuid(),
  work_step_id uuid not null references public.user_work_steps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version >= 1),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (work_step_id, version)
);

create index if not exists user_work_step_versions_step_idx
  on public.user_work_step_versions (work_step_id, version desc);
create index if not exists user_work_step_versions_user_idx
  on public.user_work_step_versions (user_id, created_at desc);

alter table public.user_work_step_versions enable row level security;

revoke all on table public.user_work_step_versions from anon;
grant select, insert, delete on table public.user_work_step_versions to authenticated;

create policy "Users can view own work step versions"
  on public.user_work_step_versions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own work step versions"
  on public.user_work_step_versions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own work step versions"
  on public.user_work_step_versions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.capture_work_step_version()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (
    old.title is distinct from new.title
    or old.detail is distinct from new.detail
    or old.analysis_data is distinct from new.analysis_data
    or old.tags is distinct from new.tags
    or old.locale is distinct from new.locale
  ) then
    insert into public.user_work_step_versions (
      work_step_id, user_id, version, snapshot
    ) values (
      old.id,
      old.user_id,
      old.version,
      jsonb_build_object(
        'title', old.title,
        'detail', old.detail,
        'analysis_data', old.analysis_data,
        'tags', old.tags,
        'locale', old.locale,
        'source_project_id', old.source_project_id,
        'source_step_index', old.source_step_index,
        'source_project_title', old.source_project_title,
        'is_favorite', old.is_favorite,
        'use_count', old.use_count,
        'last_used_at', old.last_used_at,
        'updated_at', old.updated_at
      )
    )
    on conflict (work_step_id, version) do nothing;

    new.version := old.version + 1;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_capture_work_step_version on public.user_work_steps;
create trigger trg_capture_work_step_version
before update on public.user_work_steps
for each row execute function public.capture_work_step_version();

revoke all on function public.capture_work_step_version() from public;
revoke all on function public.capture_work_step_version() from anon;
revoke all on function public.capture_work_step_version() from authenticated;

create or replace function public.save_jsa_draft_snapshot(
  p_id uuid,
  p_expected_version integer,
  p_title text,
  p_current_stage text,
  p_form_data jsonb,
  p_participants jsonb,
  p_procedures jsonb,
  p_analysis_data jsonb,
  p_layout_data jsonb,
  p_source_project_id uuid
)
returns public.user_jsa_drafts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.user_jsa_drafts;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  insert into public.user_jsa_drafts (
    id, user_id, title, current_stage, form_data, participants,
    procedures, analysis_data, layout_data, source_project_id,
    version, updated_at, last_opened_at
  )
  values (
    p_id, auth.uid(), coalesce(nullif(trim(p_title), ''), 'Untitled JSA'),
    p_current_stage, coalesce(p_form_data, '{}'::jsonb),
    coalesce(p_participants, '[]'::jsonb),
    coalesce(p_procedures, '[]'::jsonb),
    coalesce(p_analysis_data, '[]'::jsonb),
    coalesce(p_layout_data, '{}'::jsonb),
    p_source_project_id, 1, now(), now()
  )
  on conflict (id) do update
  set
    title = excluded.title,
    current_stage = excluded.current_stage,
    form_data = excluded.form_data,
    participants = excluded.participants,
    procedures = excluded.procedures,
    analysis_data = excluded.analysis_data,
    layout_data = excluded.layout_data,
    source_project_id = excluded.source_project_id,
    version = public.user_jsa_drafts.version + 1,
    updated_at = now(),
    last_opened_at = now()
  where public.user_jsa_drafts.user_id = auth.uid()
    and p_expected_version is not null
    and public.user_jsa_drafts.version = p_expected_version
  returning * into v_row;

  if v_row.id is null then
    raise exception 'DRAFT_VERSION_CONFLICT' using errcode = 'P0001';
  end if;

  return v_row;
end;
$$;

revoke all on function public.save_jsa_draft_snapshot(
  uuid, integer, text, text, jsonb, jsonb, jsonb, jsonb, jsonb, uuid
) from public;
revoke all on function public.save_jsa_draft_snapshot(
  uuid, integer, text, text, jsonb, jsonb, jsonb, jsonb, jsonb, uuid
) from anon;
grant execute on function public.save_jsa_draft_snapshot(
  uuid, integer, text, text, jsonb, jsonb, jsonb, jsonb, jsonb, uuid
) to authenticated;
