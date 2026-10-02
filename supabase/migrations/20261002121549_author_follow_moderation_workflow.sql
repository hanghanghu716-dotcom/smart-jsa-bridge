-- Public identities are opt-in display names, never copied from account profiles.
create table jsa_private.author_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null check(length(nickname) between 2 and 40),
 bio text not null default '' check(length(bio)<=300)
);
create table jsa_private.author_follows (
 follower_id uuid references auth.users(id) on delete cascade,
 author_id uuid references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(follower_id,author_id), check(follower_id<>author_id)
);
create index author_follows_author on jsa_private.author_follows(author_id);
alter table jsa_private.author_profiles enable row level security;
alter table jsa_private.author_follows enable row level security;
revoke all on jsa_private.author_profiles,jsa_private.author_follows from public,anon,authenticated;

create function jsa_private.author_action(p_action text,p_id uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result jsonb; items jsonb; n integer:=0; off integer:=least(100000,greatest(0,coalesce((p_payload->>'offset')::integer,0)));
begin
 if actor is not null and not exists(select 1 from auth.users where id=actor) then raise exception 'AUTH_REQUIRED'; end if;
 if p_action not in ('author') and actor is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_action='profile' then
  if length(trim(coalesce(p_payload->>'nickname',''))) not between 2 and 40 or length(coalesce(p_payload->>'bio',''))>300 then raise exception 'INVALID_PROFILE'; end if;
  insert into jsa_private.author_profiles values(actor,trim(p_payload->>'nickname'),trim(coalesce(p_payload->>'bio','')))
  on conflict(user_id) do update set nickname=excluded.nickname,bio=excluded.bio;
  return jsonb_build_object('ok',true);
 end if;
 if p_action='unfollow' then
  delete from jsa_private.author_follows where follower_id=actor and author_id=p_id;
  return jsonb_build_object('ok',true);
 end if;
 if p_action in ('author','follow') then
  if p_id is null or (p_id is distinct from actor and (not exists(select 1 from public.jsa_projects p where p.author_id=p_id and p.is_public and jsa_private.community_visible(p.id))
   or exists(select 1 from public.user_blocks where (blocker_id=actor and blocked_user_id=p_id) or (blocker_id=p_id and blocked_user_id=actor)))) then return null; end if;
  if p_action='follow' then
   if p_id=actor then raise exception 'SELF_FOLLOW';end if;
   perform pg_advisory_xact_lock(hashtextextended(actor::text,712));
   if (select count(*) from jsa_private.author_follows where follower_id=actor)>=500 then raise exception 'FOLLOW_LIMIT'; end if;
   insert into jsa_private.author_follows(follower_id,author_id) values(actor,p_id) on conflict do nothing;
  end if;
  select count(*) into n from public.jsa_projects p where p.author_id=p_id and p.is_public and jsa_private.community_visible(p.id)
   and not exists(select 1 from public.user_project_blocks b where b.user_id=actor and b.project_id=p.id);
  select coalesce(jsonb_agg(to_jsonb(q)),'[]') into items from (
   select p.id,p.title,p.public_locale,p.created_at from public.jsa_projects p where p.author_id=p_id and p.is_public and jsa_private.community_visible(p.id)
   and not exists(select 1 from public.user_project_blocks b where b.user_id=actor and b.project_id=p.id)
   order by p.created_at desc,p.id limit 12 offset off) q;
  return jsonb_build_object('id',p_id,'nickname',(select nickname from jsa_private.author_profiles where user_id=p_id),
   'bio',(select bio from jsa_private.author_profiles where user_id=p_id),'own',p_id=actor,'following',exists(select 1 from jsa_private.author_follows where follower_id=actor and author_id=p_id),
   'followers',(select count(*) from jsa_private.author_follows where author_id=p_id),'total',n,'items',items,'hasMore',off+12<n);
 end if;
 if p_action='following' then
  select coalesce(jsonb_agg(to_jsonb(q)),'[]') into items from (
   select f.author_id id,a.nickname from jsa_private.author_follows f left join jsa_private.author_profiles a on a.user_id=f.author_id
   where f.follower_id=actor order by f.created_at desc,f.author_id limit 501) q;
  return items;
 end if;
 if p_action='feed' then
  select coalesce(jsonb_agg(to_jsonb(q)),'[]') into items from (
   select p.id,p.title,p.author_id,p.public_locale,p.created_at,a.nickname
   from public.jsa_projects p join jsa_private.author_follows f on f.author_id=p.author_id and f.follower_id=actor
   left join jsa_private.author_profiles a on a.user_id=p.author_id
   where p.is_public and jsa_private.community_visible(p.id)
   and not exists(select 1 from public.user_blocks b where (b.blocker_id=actor and b.blocked_user_id=p.author_id) or (b.blocker_id=p.author_id and b.blocked_user_id=actor))
   and not exists(select 1 from public.user_project_blocks b where b.user_id=actor and b.project_id=p.id)
   order by p.created_at desc,p.id limit 13 offset off) q;
  return items;
 end if;
 raise exception 'INVALID_ACTION';
end $$;
revoke all on function jsa_private.author_action(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function jsa_private.author_action(text,uuid,jsonb) to anon,authenticated;
create function public.author_action(p_action text,p_id uuid default null,p_payload jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select jsa_private.author_action(p_action,p_id,p_payload)$$;
revoke all on function public.author_action(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.author_action(text,uuid,jsonb) to anon,authenticated;

alter table public.community_requests drop constraint community_requests_status_check;
alter table public.community_requests add constraint community_requests_status_check check(status in ('open','reviewing','awaiting_changes','resolved','declined'));
alter table public.community_requests add column evidence text not null default '' check(length(evidence)<=1000);
alter table public.community_requests add column priority integer generated always as(case when category in ('privacy','safety') then 2 when category='copyright' then 1 else 0 end) stored;
create index community_requests_queue on public.community_requests(status,priority desc,created_at);
create table jsa_private.report_snapshots (
 request_id uuid primary key references public.community_requests(id) on delete cascade,
 document jsonb not null
);
alter table jsa_private.report_snapshots enable row level security;
revoke all on jsa_private.report_snapshots from public,anon,authenticated;
-- Store only the reported document body, never account or signature fields.
create function jsa_private.capture_report() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.project_id is not null then
  insert into jsa_private.report_snapshots select new.id,jsonb_build_object('title',p.title,'updated_at',p.updated_at,'analysis_data',p.analysis_data)
  from public.jsa_projects p where p.id=new.project_id;
 end if;
 return new;
end $$;
revoke all on function jsa_private.capture_report() from public,anon,authenticated;
create trigger capture_community_report after insert on public.community_requests for each row execute function jsa_private.capture_report();

-- Changes reopen review, but never automatically restore a restricted publication.
create function jsa_private.requeue_report() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (new.title,new.analysis_data,new.publication_context) is distinct from (old.title,old.analysis_data,old.publication_context) then
  update public.community_requests set status='reviewing',updated_at=clock_timestamp() where project_id=new.id and status='awaiting_changes';
 end if;
 return new;
end $$;
revoke all on function jsa_private.requeue_report() from public,anon,authenticated;
create trigger requeue_community_report after update on public.jsa_projects for each row execute function jsa_private.requeue_report();

create or replace function jsa_private.community_action(p_action text,p_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); request_row public.community_requests; project_owner uuid; result jsonb; decision text; reason text; revision timestamptz;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) then raise exception 'AUTH_REQUIRED';end if;
 if p_action='status' then return jsonb_build_object('admin',jsa_private.community_admin());end if;
 if p_action='request' then
  perform pg_advisory_xact_lock(hashtextextended(actor::text,611));
  if p_id is not null and not exists(select 1 from public.jsa_projects where id=p_id and ((is_public and jsa_private.community_visible(id)) or author_id=actor)) then raise exception 'NOT_FOUND';end if;
  select to_jsonb(r) into result from public.community_requests r where user_id=actor and project_id is not distinct from p_id and category=p_payload->>'category'
   and status in ('open','reviewing','awaiting_changes') and (p_id is not null or detail=trim(p_payload->>'detail')) order by created_at desc limit 1;
  if result is not null then return result||jsonb_build_object('duplicate',true);end if;
  if (select count(*) from public.community_requests where user_id=actor and created_at>now()-interval '1 day')>=20 then raise exception 'RATE_LIMIT';end if;
  insert into public.community_requests(user_id,project_id,category,detail,evidence)
   values(actor,p_id,p_payload->>'category',trim(p_payload->>'detail'),trim(coalesce(p_payload->>'evidence',''))) returning to_jsonb(community_requests.*) into result;
  return result;
 end if;
 if p_action='export' then
  return jsonb_build_object('profile',(select to_jsonb(p) from public.profiles p where id=actor),'projects',coalesce((select jsonb_agg(to_jsonb(p)) from public.jsa_projects p where author_id=actor and user_id=actor),'[]'::jsonb),'requests',coalesce((select jsonb_agg(to_jsonb(r)) from public.community_requests r where user_id=actor),'[]'::jsonb));
 end if;
 if not jsa_private.community_admin() then raise exception 'ACCESS_DENIED';end if;
 if p_action='queue' then
  return coalesce((select jsonb_agg(to_jsonb(r)) from (
   select r.*,p.title project_title,p.updated_at project_revision,
    r.status in ('open','reviewing') and r.created_at<now()-interval '3 days' overdue,
    (select count(*) from public.community_requests other where other.project_id=r.project_id and other.status in ('open','reviewing','awaiting_changes')) related_reports,
    exists(select 1 from jsa_private.content_restrictions c where c.project_id=r.project_id and c.restricted) restricted
   from public.community_requests r left join public.jsa_projects p on p.id=r.project_id
   where case coalesce(p_payload->>'status','pending') when 'all' then true when 'pending' then r.status in ('open','reviewing','awaiting_changes') else r.status=p_payload->>'status' end
   order by r.priority desc,r.created_at,r.id limit 50 offset least(100000,greatest(0,coalesce((p_payload->>'offset')::integer,0)))
  ) r),'[]'::jsonb);
 end if;
 if p_action='report_detail' then
  return jsonb_build_object('snapshot',(select document from jsa_private.report_snapshots where request_id=p_id),
   'history',coalesce((select jsonb_agg(to_jsonb(a)) from (select audit.action,audit.reason,audit.created_at from jsa_private.community_audit audit where audit.request_id=p_id order by audit.created_at desc limit 50) a),'[]'::jsonb));
 end if;
 if p_action='decide' then
  select * into request_row from public.community_requests where id=p_id for update;
  if not found then raise exception 'NOT_FOUND';end if;
  if (p_payload->>'expectedUpdatedAt')::timestamptz is distinct from request_row.updated_at then raise exception 'STALE_REQUEST';end if;
  decision=p_payload->>'decision';reason=trim(p_payload->>'reason');
  if decision is null or decision not in ('restrict','restore','reviewing','resolve','decline','request_changes') or reason is null or length(reason)<10 or length(reason)>2000 then raise exception 'INVALID_DECISION';end if;
  if request_row.project_id is not null then
   select author_id,updated_at into project_owner,revision from public.jsa_projects where id=request_row.project_id for share;
   if (p_payload->>'projectRevision')::timestamptz is distinct from revision then raise exception 'STALE_DOCUMENT';end if;
  end if;
  if decision in ('restrict','restore','request_changes') and project_owner is null then raise exception 'NOT_FOUND';end if;
  if decision in ('restrict','restore') then
   insert into jsa_private.content_restrictions values(request_row.project_id,decision='restrict') on conflict(project_id) do update set restricted=excluded.restricted;
  end if;
  if decision in ('restrict','restore','request_changes') and project_owner is distinct from request_row.user_id then
   insert into public.community_notices(user_id,request_id,project_id,action,reason) values(project_owner,p_id,request_row.project_id,decision,reason);
  end if;
  update public.community_requests set status=case decision when 'reviewing' then 'reviewing' when 'request_changes' then 'awaiting_changes' when 'decline' then 'declined' else 'resolved' end,updated_at=clock_timestamp() where id=p_id;
  insert into public.community_notices(user_id,request_id,project_id,action,reason) values(request_row.user_id,p_id,request_row.project_id,decision,reason);
  insert into jsa_private.community_audit(actor,request_id,project_id,action,reason) values(actor,p_id,request_row.project_id,decision,reason);
  return jsonb_build_object('ok',true);
 end if;
 raise exception 'INVALID_ACTION';
end $$;
notify pgrst,'reload schema';
