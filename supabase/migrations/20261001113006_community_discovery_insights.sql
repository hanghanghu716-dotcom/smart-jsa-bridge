-- No paid services or third-party tracking. Public visibility and editorial approval
-- are separate; edits invalidate approval. All administrative writes are audited.
create table jsa_private.publication_fingerprints (
 project_id uuid primary key references public.jsa_projects(id) on delete cascade,
 body text not null, body_hash text not null, revision_hash text not null
);
create index publication_body_hash_idx on jsa_private.publication_fingerprints(body_hash);
create index publication_body_trgm_idx on jsa_private.publication_fingerprints using gin(body public.gin_trgm_ops);
alter table jsa_private.publication_fingerprints enable row level security;
create function jsa_private.publication_body(a jsonb) returns text language sql immutable set search_path='' as $$
 select lower(regexp_replace(coalesce(string_agg(concat_ws(' ',s->'proc'->>'stepTitle',s->'proc'->>'stepDetail',s->>'frequency',s->>'severity',s->>'riskLevel',
 (select string_agg(concat_ws(' ',r->>'category',r->>'factor',coalesce(nullif(r->>'current_measure',''),r->>'measure'),r->>'recommend_measure'),' ' order by rn)
 from jsonb_array_elements(case when jsonb_typeof(s->'risks')='array' then s->'risks' else '[]'::jsonb end) with ordinality risks(r,rn))),' ' order by sn),''),'[[:space:][:punct:]]+',' ','g'))
 from jsonb_array_elements(case when jsonb_typeof(a)='array' then a else '[]'::jsonb end) with ordinality steps(s,sn)
$$;
create function jsa_private.fingerprint_publication() returns trigger language plpgsql security definer set search_path='' as $$
declare b text;
begin
 if not new.is_public then delete from jsa_private.publication_fingerprints where project_id=new.id; return new; end if;
 b:=jsa_private.publication_body(new.analysis_data);
 insert into jsa_private.publication_fingerprints values(new.id,b,md5(b),md5(jsonb_build_array(new.title,new.public_locale,new.analysis_data,new.tags,new.publication_context,new.reuse_license)::text))
 on conflict(project_id) do update set body=excluded.body,body_hash=excluded.body_hash,revision_hash=excluded.revision_hash;
 return new;
end $$;
create trigger publication_fingerprint after insert or update of is_public,title,public_locale,analysis_data,tags,publication_context,reuse_license on public.jsa_projects for each row execute function jsa_private.fingerprint_publication();
insert into jsa_private.publication_fingerprints
 select id,jsa_private.publication_body(analysis_data),md5(jsa_private.publication_body(analysis_data)),md5(jsonb_build_array(title,public_locale,analysis_data,tags,publication_context,reuse_license)::text)
 from public.jsa_projects where is_public;
create table jsa_private.publication_reviews (
 project_id uuid primary key references public.jsa_projects(id) on delete cascade,
 revision_hash text not null, state text not null check(state in ('approved','rejected')),
 reason text not null, reviewer uuid not null references auth.users(id), reviewed_at timestamptz not null default now()
);
alter table jsa_private.publication_reviews enable row level security;
create table jsa_private.editorial_links (
 project_id uuid references public.jsa_projects(id) on delete cascade,
 kind text check(kind in ('guide','case')), target text not null,
 primary key(project_id,kind,target)
);
create index editorial_target_idx on jsa_private.editorial_links(kind,target);
alter table jsa_private.editorial_links enable row level security;
create table jsa_private.discovery_audit (
 id bigint generated always as identity primary key, actor uuid not null references auth.users(id),
 action text not null, project_id uuid, payload jsonb not null, created_at timestamptz not null default now()
);
alter table jsa_private.discovery_audit enable row level security;
create table jsa_private.search_months (
 month date primary key check(extract(day from month)=1), clicks bigint not null check(clicks>=0 and clicks<=1000000000),
 source text not null, updated_at timestamptz not null default now()
);
alter table jsa_private.search_months enable row level security;

create function jsa_private.publication_assessment(pid uuid) returns jsonb language plpgsql stable security definer set search_path='' set pg_trgm.similarity_threshold='0.90' as $$
declare f jsa_private.publication_fingerprints; p public.jsa_projects; duplicate uuid; score real; review text;
begin
 select * into p from public.jsa_projects where id=pid and is_public and jsa_private.community_visible(id);
 if not found then return null; end if;
 select * into f from jsa_private.publication_fingerprints where project_id=pid;
 if not found then return jsonb_build_object('checked',false); end if;
 -- Compare only older, still visible publications. Short boilerplate is not evidence.
 if length(f.body)>=180 then
 select q.id,public.similarity(x.body,f.body) into duplicate,score
 from jsa_private.publication_fingerprints x join public.jsa_projects q on q.id=x.project_id
 where q.is_public and jsa_private.community_visible(q.id) and (q.created_at,q.id)<(p.created_at,p.id)
 and (x.body_hash=f.body_hash or (x.body operator(public.%) f.body and public.similarity(x.body,f.body)>=0.93))
 order by (x.body_hash=f.body_hash) desc,public.similarity(x.body,f.body) desc,q.created_at,q.id limit 1;
 end if;
 select case when r.revision_hash=f.revision_hash then r.state else 'stale' end into review from jsa_private.publication_reviews r where r.project_id=pid;
 return jsonb_build_object('checked',true,'duplicate_of',duplicate,'similarity',score,'review',coalesce(review,'pending'),'revision',f.revision_hash);
end $$;
create or replace view public.public_jsa_catalog with(security_invoker=true) as
select p.id,p.title,p.author_id,p.is_public,p.public_locale,p.form_data,p.analysis_data,p.custom_layout,p.tags,p.created_at,p.updated_at,p.scrap_count,
 coalesce(m.view_count,0) view_count,coalesce(m.reuse_count,0) reuse_count,p.reuse_license,p.publication_context,p.license_accepted_at,
 case when exists(select 1 from public.jsa_projects source where source.id=p.parent_id and source.is_public and jsa_private.community_visible(source.id)) then p.parent_id else null end parent_id,
 (select count(*) from public.jsa_projects child where child.parent_id=p.id and child.is_public and jsa_private.community_visible(child.id)) fork_count,
 jsa_private.publication_assessment(p.id) assessment
from public.jsa_projects p left join public.public_jsa_metrics m on m.project_id=p.id where p.is_public and jsa_private.community_visible(p.id);

create function jsa_private.discovery_links(pid uuid default null,lk text default null,lt text default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p public.jsa_projects; result jsonb;
begin
 if pid is null then
  select coalesce(jsonb_agg(jsonb_build_object('id',p2.id,'title',p2.title,'locale',p2.public_locale)),'[]') into result from
   (select p1.* from jsa_private.editorial_links e join public.jsa_projects p1 on p1.id=e.project_id where e.kind=lk and e.target=lt and p1.is_public and jsa_private.community_visible(p1.id) order by p1.updated_at desc,p1.id limit 12) p2;
  return result;
 end if;
 select * into p from public.jsa_projects where id=pid and is_public and jsa_private.community_visible(id);
 if not found then return null; end if;
 return jsonb_build_object(
 'source',(select jsonb_build_object('id',id,'title',title,'locale',public_locale) from public.jsa_projects where id=p.parent_id and is_public and jsa_private.community_visible(id)),
 'children',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'locale',public_locale)) from (select * from public.jsa_projects where parent_id=pid and is_public and jsa_private.community_visible(id) order by created_at desc,id limit 12) c),'[]'),
 'related',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'locale',public_locale)) from
 (select q.* from public.jsa_projects q where q.id<>pid and q.is_public and jsa_private.community_visible(q.id) and q.tags && p.tags
 and q.public_locale=p.public_locale and q.reuse_license='community-v1' and q.title !~* '^test[_[:space:]-]'
 order by (select count(*) from unnest(q.tags) t where t=any(p.tags)) desc,q.created_at desc,q.id limit 6) r),'[]'),
 'editorial',coalesce((select jsonb_agg(jsonb_build_object('kind',e.kind,'target',e.target)) from jsa_private.editorial_links e where e.project_id=pid),'[]'));
end $$;
create function public.discovery_links(p_id uuid default null,p_kind text default null,p_target text default null) returns jsonb language sql security invoker set search_path='' as $$select jsa_private.discovery_links(p_id,p_kind,p_target)$$;

create function jsa_private.discovery_admin(action text,pid uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare f jsa_private.publication_fingerprints; month_key date; result jsonb;
begin
 if auth.uid() is null or not jsa_private.community_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 if action='dashboard' then
  with months as (select generate_series(date_trunc('month',now() at time zone 'UTC')-interval '11 months',date_trunc('month',now() at time zone 'UTC'),interval '1 month')::date as month),
  eligible as (select p.id,p.parent_id,p.created_at from public.jsa_projects p where p.is_public and jsa_private.community_visible(p.id) and p.title !~* '^test[_[:space:]-]'),
  activity as (select date_trunc('month',event_day)::date as month,count(*) filter(where step_index>=0) reused_steps,count(distinct (e.project_id,actor,event_day)) filter(where step_index>=0) reuse_actions from jsa_metrics_private.events e join eligible p on p.id=e.project_id group by 1),
  publications as (select date_trunc('month',p.created_at at time zone 'UTC')::date as month,count(*) published,count(*) filter(where exists(select 1 from eligible source where source.id=p.parent_id)) derived from eligible p group by 1)
  select jsonb_agg(jsonb_build_object('month',m.month,'reused_steps',coalesce(a.reused_steps,0),'reuse_actions',coalesce(a.reuse_actions,0),'published',coalesce(p.published,0),'derived',coalesce(p.derived,0),'search_clicks',s.clicks,'search_source',s.source) order by m.month desc) into result
  from months m left join activity a using(month) left join publications p using(month) left join jsa_private.search_months s using(month);
  return result;
 elsif action='queue' then
  return coalesce((select jsonb_agg(to_jsonb(q)) from (select id,title,public_locale,assessment from public.public_jsa_catalog order by updated_at desc,id limit 100 offset greatest(0,least(100000,coalesce((payload->>'offset')::int,0))))q),'[]');
 elsif action='review' then
  select * into f from jsa_private.publication_fingerprints where project_id=pid for update;
  if not found or f.revision_hash is distinct from payload->>'revision' then raise exception 'CONTENT_CHANGED'; end if;
  if payload->>'state' not in ('approved','rejected') or length(trim(coalesce(payload->>'reason','')))<10 then raise exception 'REVIEW_REQUIRED'; end if;
  insert into jsa_private.publication_reviews values(pid,f.revision_hash,payload->>'state',left(payload->>'reason',2000),auth.uid(),now()) on conflict(project_id) do update set revision_hash=excluded.revision_hash,state=excluded.state,reason=excluded.reason,reviewer=excluded.reviewer,reviewed_at=excluded.reviewed_at;
 elsif action in ('link','unlink') then
  if not exists(select 1 from public.jsa_projects where id=pid and is_public and jsa_private.community_visible(id)) then raise exception 'NOT_PUBLIC'; end if;
  if payload->>'kind'='guide' then
   if payload->>'target' not in ('common','construction','manufacturing','chemical','high-risk','general') then raise exception 'INVALID_GUIDE'; end if;
  elsif payload->>'kind'='case' then
   if not exists(select 1 from public.case_studies where post_group_id=payload->>'target') then raise exception 'INVALID_CASE'; end if;
  else raise exception 'INVALID_KIND'; end if;
  if action='link' then insert into jsa_private.editorial_links values(pid,payload->>'kind',payload->>'target') on conflict do nothing;
  else delete from jsa_private.editorial_links where project_id=pid and kind=payload->>'kind' and target=payload->>'target'; end if;
 elsif action='search_month' then
  month_key:=(payload->>'month')::date;
  if month_key<>date_trunc('month',month_key)::date or month_key<date_trunc('month',now())-interval '11 months' or month_key>current_date or length(trim(coalesce(payload->>'source','')))<5 then raise exception 'INVALID_MONTH'; end if;
  insert into jsa_private.search_months values(month_key,(payload->>'clicks')::bigint,left(payload->>'source',500),now()) on conflict(month) do update set clicks=excluded.clicks,source=excluded.source,updated_at=excluded.updated_at;
 else raise exception 'INVALID_ACTION'; end if;
 insert into jsa_private.discovery_audit(actor,action,project_id,payload) values(auth.uid(),action,pid,payload);
 return jsonb_build_object('ok',true);
end $$;
create function public.discovery_admin(p_action text,p_id uuid default null,p_payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select jsa_private.discovery_admin(p_action,p_id,p_payload)$$;
revoke all on function jsa_private.publication_body(jsonb),jsa_private.fingerprint_publication(),jsa_private.publication_assessment(uuid),jsa_private.discovery_links(uuid,text,text),jsa_private.discovery_admin(text,uuid,jsonb),public.discovery_links(uuid,text,text),public.discovery_admin(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function jsa_private.publication_assessment(uuid),jsa_private.discovery_links(uuid,text,text),public.discovery_links(uuid,text,text) to anon,authenticated;
grant execute on function jsa_private.discovery_admin(text,uuid,jsonb),public.discovery_admin(text,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
