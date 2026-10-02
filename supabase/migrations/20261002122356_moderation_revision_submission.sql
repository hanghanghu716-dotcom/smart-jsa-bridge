-- Keep the deployed v1 API working while the new UI is being released.
alter table public.community_requests add column revision_project_id uuid references public.jsa_projects(id) on delete set null;
create index community_requests_revision on public.community_requests(revision_project_id);
create or replace function jsa_private.community_workflow(p_action text,p_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); request_row public.community_requests; project_owner uuid; result jsonb; decision text; reason text; revision timestamptz; target_id uuid;
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

 if p_action='corrections' then
  return jsonb_build_object('requests',coalesce((select jsonb_agg(to_jsonb(q)) from (
   select r.id,r.project_id,r.revision_project_id,r.status,p.title from public.community_requests r join public.jsa_projects p on p.id=r.project_id
   where p.author_id=actor and (r.status='awaiting_changes' or (r.status='resolved' and exists(select 1 from jsa_private.content_restrictions c where c.project_id=coalesce(r.revision_project_id,r.project_id) and c.restricted))) order by r.updated_at desc limit 100) q),'[]'::jsonb),
   'documents',coalesce((select jsonb_agg(to_jsonb(q)) from (select id,title from public.jsa_projects where author_id=actor and is_public order by created_at desc,id limit 100) q),'[]'::jsonb));
 end if;
 if p_action='resubmit' then
  select r.* into request_row from public.community_requests r join public.jsa_projects p on p.id=r.project_id where r.id=p_id and p.author_id=actor for update of r;
  if not found then raise exception 'ACCESS_DENIED';end if;
  if request_row.status<>'awaiting_changes' and not(request_row.status='resolved' and exists(select 1 from jsa_private.content_restrictions where project_id=coalesce(request_row.revision_project_id,request_row.project_id) and restricted)) then raise exception 'STALE_REQUEST';end if;
  target_id=(p_payload->>'revisionId')::uuid;
  if not exists(select 1 from public.jsa_projects where id=target_id and author_id=actor and is_public) then raise exception 'NOT_FOUND';end if;
  if target_id=coalesce(request_row.revision_project_id,request_row.project_id) then raise exception 'NEW_REVISION_REQUIRED';end if;
  update public.community_requests set revision_project_id=target_id,status='reviewing',updated_at=clock_timestamp() where id=p_id;
  insert into jsa_private.community_audit(actor,request_id,project_id,action,reason) values(actor,p_id,target_id,'resubmit','Author submitted a replacement publication for review.');
  return jsonb_build_object('ok',true);
 end if;
 if not jsa_private.community_admin() then raise exception 'ACCESS_DENIED';end if;
 if p_action='queue' then
  return coalesce((select jsonb_agg(to_jsonb(r)) from (
   select r.*,p.title project_title,p.updated_at project_revision,
    r.status in ('open','reviewing') and r.created_at<now()-interval '3 days' overdue,
    (select count(*) from public.community_requests other where other.project_id=r.project_id and other.status in ('open','reviewing','awaiting_changes')) related_reports,
    exists(select 1 from jsa_private.content_restrictions c where c.project_id=coalesce(r.revision_project_id,r.project_id) and c.restricted) restricted
   from public.community_requests r left join public.jsa_projects p on p.id=coalesce(r.revision_project_id,r.project_id)
   where case coalesce(p_payload->>'status','pending') when 'all' then true when 'pending' then r.status in ('open','reviewing','awaiting_changes') else r.status=p_payload->>'status' end
   order by r.priority desc,r.created_at,r.id limit 50 offset least(100000,greatest(0,coalesce((p_payload->>'offset')::integer,0)))
  ) r),'[]'::jsonb);
 end if;
 if p_action='report_detail' then
  return jsonb_build_object('current_document',(select jsonb_build_object('title',p.title,'updated_at',p.updated_at,'analysis_data',p.analysis_data) from public.community_requests r join public.jsa_projects p on p.id=coalesce(r.revision_project_id,r.project_id) where r.id=p_id),'snapshot',(select document from jsa_private.report_snapshots where request_id=p_id),
   'history',coalesce((select jsonb_agg(to_jsonb(a)) from (select audit.action,audit.reason,audit.created_at from jsa_private.community_audit audit where audit.request_id=p_id order by audit.created_at desc limit 50) a),'[]'::jsonb));
 end if;
 if p_action='decide' then
  select * into request_row from public.community_requests where id=p_id for update;
  if not found then raise exception 'NOT_FOUND';end if;
  if (p_payload->>'expectedUpdatedAt')::timestamptz is distinct from request_row.updated_at then raise exception 'STALE_REQUEST';end if;
  decision=p_payload->>'decision';reason=trim(p_payload->>'reason');
  if decision is null or decision not in ('restrict','restore','reviewing','resolve','decline','request_changes') or reason is null or length(reason)<10 or length(reason)>2000 then raise exception 'INVALID_DECISION';end if;
  target_id=coalesce(request_row.revision_project_id,request_row.project_id);
  if target_id is not null then
   select author_id,updated_at into project_owner,revision from public.jsa_projects where id=target_id for share;
   if (p_payload->>'projectRevision')::timestamptz is distinct from revision then raise exception 'STALE_DOCUMENT';end if;
  end if;
  if decision in ('restrict','restore','request_changes') and project_owner is null then raise exception 'NOT_FOUND';end if;
  if decision in ('restrict','restore') then
   insert into jsa_private.content_restrictions values(target_id,decision='restrict') on conflict(project_id) do update set restricted=excluded.restricted;
  end if;
  if decision in ('restrict','restore','request_changes') and project_owner is distinct from request_row.user_id then
   insert into public.community_notices(user_id,request_id,project_id,action,reason) values(project_owner,p_id,target_id,decision,reason);
  end if;
  update public.community_requests set status=case decision when 'reviewing' then 'reviewing' when 'request_changes' then 'awaiting_changes' when 'decline' then 'declined' else 'resolved' end,updated_at=clock_timestamp() where id=p_id;
  insert into public.community_notices(user_id,request_id,project_id,action,reason) values(request_row.user_id,p_id,target_id,decision,reason);
  insert into jsa_private.community_audit(actor,request_id,project_id,action,reason) values(actor,p_id,target_id,decision,reason);
  return jsonb_build_object('ok',true);
 end if;
 raise exception 'INVALID_ACTION';
end $$;

revoke all on function jsa_private.community_workflow(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function jsa_private.community_workflow(text,uuid,jsonb) to authenticated;
create function public.community_workflow(p_action text,p_id uuid default null,p_payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select jsa_private.community_workflow(p_action,p_id,p_payload)$$;
revoke all on function public.community_workflow(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.community_workflow(text,uuid,jsonb) to authenticated;
create or replace function jsa_private.community_action(p_action text,p_id uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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

create or replace function jsa_private.requeue_report() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (new.title,new.analysis_data,new.publication_context) is distinct from (old.title,old.analysis_data,old.publication_context) then
  update public.community_requests set status='reviewing',updated_at=clock_timestamp() where coalesce(revision_project_id,project_id)=new.id and status='awaiting_changes';
 end if;
 return new;
end $$;
notify pgrst,'reload schema';
