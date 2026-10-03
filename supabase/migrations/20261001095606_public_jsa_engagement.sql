-- Aggregate statistics are separate from editable projects/revisions.
create schema if not exists jsa_metrics_private;
revoke all on schema jsa_metrics_private from public, anon, authenticated;
grant usage on schema jsa_metrics_private to anon, authenticated;

create table public.public_jsa_metrics (
  project_id uuid primary key references public.jsa_projects(id) on delete cascade,
  view_count bigint not null default 0 check(view_count >= 0),
  reuse_count bigint not null default 0 check(reuse_count >= 0)
);
alter table public.public_jsa_metrics enable row level security;
revoke all on public.public_jsa_metrics from public, anon, authenticated;
grant select on public.public_jsa_metrics to anon, authenticated;
create policy visible_public_metrics on public.public_jsa_metrics for select to anon, authenticated
using (exists(select 1 from public.jsa_projects p where p.id=project_id and p.is_public));

create table jsa_metrics_private.events (
  project_id uuid not null references public.jsa_projects(id) on delete cascade,
  actor text not null,
  event_day date not null,
  step_index integer not null check(step_index >= -1),
  primary key(project_id,actor,event_day,step_index)
);
alter table jsa_metrics_private.events enable row level security;
revoke all on jsa_metrics_private.events from public, anon, authenticated;
create index engagement_actor_day on jsa_metrics_private.events(actor,event_day);

create view public.public_jsa_catalog with (security_invoker=true) as
select p.id,p.title,p.author_id,p.is_public,p.public_locale,p.form_data,p.analysis_data,
p.custom_layout,p.tags,p.created_at,p.updated_at,p.scrap_count,
coalesce(m.view_count,0)::bigint as view_count,coalesce(m.reuse_count,0)::bigint as reuse_count
from public.jsa_projects p left join public.public_jsa_metrics m on m.project_id=p.id
where p.is_public;
revoke all on public.public_jsa_catalog from public, anon, authenticated;
grant select on public.public_jsa_catalog to anon, authenticated;

-- Only this narrowly scoped function can insert events/increment aggregates.
-- Anonymous visitor IDs provide approximate browser/day deduplication, not bot proof identity.
create function jsa_metrics_private.record_engagement(p_project_id uuid,p_kind text,p_visitor_id uuid,p_steps integer[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor_id uuid := auth.uid();
  actor_key text;
  day_key date := (now() at time zone 'UTC')::date;
  owner_id uuid;
  step_total integer;
  added integer := 0;
begin
  if p_kind is null or p_kind not in ('view','reuse') then return null; end if;
  if p_kind='reuse' and actor_id is null then return null; end if;
  if actor_id is null and p_visitor_id is null then return null; end if;
  actor_key := case when actor_id is not null then 'u:'||actor_id::text else 'v:'||p_visitor_id::text end;
  actor_key := pg_catalog.md5(actor_key);
  -- Serialize an actor's daily requests for consistent deduplication and a bounded rate.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor_key||day_key::text, 517));
  select author_id,jsonb_array_length(coalesce(analysis_data,'[]'::jsonb))
    into owner_id,step_total from public.jsa_projects where id=p_project_id and is_public for share;
  if not found then return null; end if;
  if actor_id is distinct from owner_id and
    (select count(*) from jsa_metrics_private.events where actor=actor_key and event_day=day_key) < 2000 then
    if p_kind='view' then
      insert into jsa_metrics_private.events values(p_project_id,actor_key,day_key,-1) on conflict do nothing;
      get diagnostics added = row_count;
    elsif cardinality(p_steps) between 1 and 20 then
      with inserted as (
        insert into jsa_metrics_private.events
        select p_project_id,actor_key,day_key,s from (select distinct unnest(p_steps) s) selected
        where s>=0 and s<step_total
        on conflict do nothing returning 1
      ) select count(*) into added from inserted;
    end if;
    if added>0 then
      insert into public.public_jsa_metrics(project_id,view_count,reuse_count)
        values(p_project_id,case when p_kind='view' then added else 0 end,case when p_kind='reuse' then added else 0 end)
      on conflict(project_id) do update set
        view_count=public.public_jsa_metrics.view_count+excluded.view_count,
        reuse_count=public.public_jsa_metrics.reuse_count+excluded.reuse_count;
    end if;
  end if;
  return jsonb_build_object('view_count',coalesce((select view_count from public.public_jsa_metrics where project_id=p_project_id),0),
    'reuse_count',coalesce((select reuse_count from public.public_jsa_metrics where project_id=p_project_id),0));
end $$;
revoke all on function jsa_metrics_private.record_engagement(uuid,text,uuid,integer[]) from public,anon,authenticated;
grant execute on function jsa_metrics_private.record_engagement(uuid,text,uuid,integer[]) to anon,authenticated;
create function public.record_public_jsa_engagement(p_project_id uuid,p_kind text,p_visitor_id uuid default null,p_steps integer[] default '{}')
returns jsonb language sql security invoker set search_path='' as $$
  select jsa_metrics_private.record_engagement(p_project_id,p_kind,p_visitor_id,p_steps);
$$;
revoke all on function public.record_public_jsa_engagement(uuid,text,uuid,integer[]) from public,anon,authenticated;
grant execute on function public.record_public_jsa_engagement(uuid,text,uuid,integer[]) to anon,authenticated;
notify pgrst,'reload schema';
