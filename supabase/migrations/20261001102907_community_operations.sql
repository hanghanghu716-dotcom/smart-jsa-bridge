-- Community creation/storage is free; keep accounting and ownership enforcement.
create or replace function jsa_private.enforce_project_storage() returns trigger language plpgsql security definer set search_path='' as $$
declare owner_id uuid; delta integer;
begin
 if tg_op='INSERT' then owner_id=new.author_id; delta=case when new.is_public then 0 else 1 end;
 elsif tg_op='DELETE' then owner_id=old.author_id; delta=case when old.is_public then 0 else -1 end;
 else owner_id=new.author_id; delta=(case when new.is_public then 0 else 1 end)-(case when old.is_public then 0 else 1 end); end if;
 if delta=0 then return null; end if;
 if auth.uid() is not null and owner_id is distinct from auth.uid() then raise exception 'PROJECT_OWNER_INVALID'; end if;
 insert into jsa_private.project_storage_usage(user_id,private_count) values(owner_id,greatest(delta,0))
 on conflict(user_id) do update set private_count=greatest(0,jsa_private.project_storage_usage.private_count+delta);
 return null;
end $$;
create or replace function jsa_private.read_project_storage() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED';end if;
 return jsonb_build_object('used',coalesce((select private_count from jsa_private.project_storage_usage where user_id=auth.uid()),0),'limit',null,'trial_active',false,'trial_expires_at',null,'can_create',true,'community_free',true);
end $$;

alter table public.jsa_projects add column reuse_license text check(reuse_license is null or reuse_license='community-v1');
alter table public.jsa_projects add column publication_context jsonb not null default '{}'::jsonb;
alter table public.jsa_projects add column license_accepted_at timestamptz;
create table jsa_private.content_restrictions(project_id uuid primary key references public.jsa_projects(id) on delete cascade, restricted boolean not null default false);
alter table jsa_private.content_restrictions enable row level security;
revoke all on jsa_private.content_restrictions from public,anon,authenticated;
create function jsa_private.community_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin');
$$;
create function jsa_private.community_visible(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select not exists(select 1 from jsa_private.content_restrictions where project_id=p_id and restricted);
$$;
revoke all on function jsa_private.community_admin(),jsa_private.community_visible(uuid) from public;
grant usage on schema jsa_private to anon,authenticated;
grant execute on function jsa_private.community_admin(),jsa_private.community_visible(uuid) to anon,authenticated;
create policy community_restriction on public.jsa_projects as restrictive for select to anon,authenticated
using(jsa_private.community_visible(id) or author_id=(select auth.uid()) or jsa_private.community_admin());

create function jsa_private.guard_publication() returns trigger language plpgsql set search_path='' as $$
begin
 if octet_length(new.publication_context::text)>12000 or jsonb_typeof(new.publication_context)<>'object' then raise exception 'INVALID_CONTEXT';end if;
 new.publication_context=jsonb_build_object('scope',left(coalesce(new.publication_context->>'scope',''),1800),'region',left(coalesce(new.publication_context->>'region',''),120),'limitations',left(coalesce(new.publication_context->>'limitations',''),1800),'sources',left(coalesce(new.publication_context->>'sources',''),1800));
 if new.is_public and auth.uid() is not null and (tg_op='INSERT' or not old.is_public) and new.reuse_license is distinct from 'community-v1' then raise exception 'PUBLICATION_CONSENT_REQUIRED';end if;
 if tg_op='INSERT' then new.license_accepted_at=case when new.reuse_license='community-v1' then now() else null end;
 elsif new.reuse_license is distinct from old.reuse_license then new.license_accepted_at=case when new.reuse_license='community-v1' then now() else null end;
 else new.license_accepted_at=old.license_accepted_at;end if;
 return new;
end $$;
create trigger community_publication before insert or update on public.jsa_projects for each row execute function jsa_private.guard_publication();

create or replace view public.public_jsa_catalog with(security_invoker=true) as
select p.id,p.title,p.author_id,p.is_public,p.public_locale,p.form_data,p.analysis_data,p.custom_layout,p.tags,p.created_at,p.updated_at,p.scrap_count,
coalesce(m.view_count,0)::bigint view_count,coalesce(m.reuse_count,0)::bigint reuse_count,
p.reuse_license,p.publication_context,p.license_accepted_at,
case when exists(select 1 from public.jsa_projects source where source.id=p.parent_id and source.is_public and jsa_private.community_visible(source.id)) then p.parent_id else null end parent_id,
(select count(*) from public.jsa_projects child where child.parent_id=p.id and child.is_public and jsa_private.community_visible(child.id)) fork_count
from public.jsa_projects p left join public.public_jsa_metrics m on m.project_id=p.id where p.is_public and jsa_private.community_visible(p.id);

create table public.community_requests(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 project_id uuid references public.jsa_projects(id) on delete set null,
 category text not null check(category in ('general','suggestion','privacy','copyright','safety','spam','appeal','access','erasure','correction')),
 detail text not null check(length(detail) between 10 and 4000), status text not null default 'open' check(status in ('open','reviewing','resolved','declined')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index community_requests_user on public.community_requests(user_id,created_at desc);
create index community_requests_project on public.community_requests(project_id);
create table public.community_notices(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid references public.community_requests(id) on delete set null,
 project_id uuid references public.jsa_projects(id) on delete set null,
 action text not null,reason text not null,created_at timestamptz not null default now()
);
create index community_notices_user on public.community_notices(user_id,created_at desc);
create index community_notices_request on public.community_notices(request_id);
create index community_notices_project on public.community_notices(project_id);
create table jsa_private.community_audit(id bigint generated always as identity primary key,actor uuid,request_id uuid,project_id uuid,action text,reason text,created_at timestamptz default now());
alter table jsa_private.community_audit enable row level security;
revoke all on jsa_private.community_audit from public,anon,authenticated;
alter table public.community_requests enable row level security;
alter table public.community_notices enable row level security;
revoke all on public.community_requests,public.community_notices from public,anon,authenticated;
grant select on public.community_requests,public.community_notices to authenticated;
create policy requests_read on public.community_requests for select to authenticated using(user_id=(select auth.uid()) or jsa_private.community_admin());
create policy notices_read on public.community_notices for select to authenticated using(user_id=(select auth.uid()));

create function jsa_private.community_action(p_action text,p_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); request_row public.community_requests; project_owner uuid; result jsonb; decision text; reason text;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) then raise exception 'AUTH_REQUIRED';end if;
 if p_action='status' then return jsonb_build_object('admin',jsa_private.community_admin());end if;
 if p_action='request' then
  perform pg_advisory_xact_lock(hashtextextended(actor::text,611));
  if (select count(*) from public.community_requests where user_id=actor and created_at>now()-interval '1 day')>=20 then raise exception 'RATE_LIMIT';end if;
  if p_id is not null and not exists(select 1 from public.jsa_projects where id=p_id and (is_public or author_id=actor)) then raise exception 'NOT_FOUND';end if;
  insert into public.community_requests(user_id,project_id,category,detail) values(actor,p_id,p_payload->>'category',trim(p_payload->>'detail')) returning to_jsonb(community_requests.*) into result;
  return result;
 end if;
 if p_action='export' then
  return jsonb_build_object('profile',(select to_jsonb(p) from public.profiles p where id=actor),'projects',coalesce((select jsonb_agg(to_jsonb(p)) from public.jsa_projects p where author_id=actor and user_id=actor),'[]'::jsonb),'requests',coalesce((select jsonb_agg(to_jsonb(r)) from public.community_requests r where user_id=actor),'[]'::jsonb));
 end if;
 if not jsa_private.community_admin() then raise exception 'ACCESS_DENIED';end if;
 if p_action='queue' then return coalesce((select jsonb_agg(to_jsonb(r)) from (select * from public.community_requests order by created_at desc limit 200) r),'[]'::jsonb);end if;
 if p_action='decide' then
  select * into request_row from public.community_requests where id=p_id for update;
  if not found then raise exception 'NOT_FOUND';end if;
  decision=p_payload->>'decision';reason=trim(p_payload->>'reason');
  if decision is null or decision not in ('restrict','restore','reviewing','resolve','decline') or reason is null or length(reason)<10 or length(reason)>2000 then raise exception 'INVALID_DECISION';end if;
  if decision in ('restrict','restore') then
   if request_row.project_id is null then raise exception 'NOT_FOUND';end if;
   insert into jsa_private.content_restrictions values(request_row.project_id,decision='restrict') on conflict(project_id) do update set restricted=excluded.restricted;
   select author_id into project_owner from public.jsa_projects where id=request_row.project_id;
   if project_owner is distinct from request_row.user_id then insert into public.community_notices(user_id,request_id,project_id,action,reason) values(project_owner,p_id,request_row.project_id,decision,reason);end if;
  end if;
  update public.community_requests set status=case decision when 'reviewing' then 'reviewing' when 'decline' then 'declined' else 'resolved' end,updated_at=now() where id=p_id;
  insert into public.community_notices(user_id,request_id,project_id,action,reason) values(request_row.user_id,p_id,request_row.project_id,decision,reason);
  insert into jsa_private.community_audit(actor,request_id,project_id,action,reason) values(actor,p_id,request_row.project_id,decision,reason);
  return jsonb_build_object('ok',true);
 end if;
 raise exception 'INVALID_ACTION';
end $$;
revoke all on function jsa_private.community_action(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function jsa_private.community_action(text,uuid,jsonb) to authenticated;
create function public.community_action(p_action text,p_id uuid default null,p_payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select jsa_private.community_action(p_action,p_id,p_payload) $$;
revoke all on function public.community_action(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.community_action(text,uuid,jsonb) to authenticated;
-- Import the old authenticated report inbox without losing pending reports.
insert into public.community_requests(id,user_id,project_id,category,detail,created_at)
select id,reporter_id,project_id,'safety',rpad(left(coalesce(reason,''),4000),greatest(10,length(left(coalesce(reason,''),4000))),' '),created_at from public.user_reports where reporter_id is not null;
notify pgrst,'reload schema';

create or replace function jsa_metrics_private.record_engagement(p_project_id uuid,p_kind text,p_visitor_id uuid,p_steps integer[])
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
    into owner_id,step_total from public.jsa_projects where id=p_project_id and is_public and jsa_private.community_visible(id) and (p_kind='view' or reuse_license='community-v1') for share;
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
