-- Country is document metadata, independent of screen/translation language.
alter table public.jsa_projects add column public_country text
 check (public_country in ('KR','US','CA','GB','AU','SG','DE','JP','FR','IT','ES','SA','BR','RU'));
-- These pre-existing documents were confirmed by the owner as Korean examples.
-- Leave private documents and their contexts untouched.
update public.jsa_projects set public_country='KR'
where is_public and public_locale='ko' and public_country is null
 and coalesce(form_data #>> '{context,jurisdiction}','KR') in ('','KR');
create index jsa_public_country_created on public.jsa_projects(public_country,created_at desc,id) where is_public;
create or replace view public.public_jsa_catalog with(security_invoker=true) as
select p.id,p.title,p.author_id,p.is_public,p.public_locale,p.form_data,p.analysis_data,p.custom_layout,p.tags,p.created_at,p.updated_at,p.scrap_count,
 coalesce(m.view_count,0) view_count,coalesce(m.reuse_count,0) reuse_count,p.reuse_license,p.publication_context,p.license_accepted_at,
 case when exists(select 1 from public.jsa_projects source where source.id=p.parent_id and source.is_public and jsa_private.community_visible(source.id)) then p.parent_id else null end parent_id,
 (select count(*) from public.jsa_projects child where child.parent_id=p.id and child.is_public and jsa_private.community_visible(child.id)) fork_count,
 jsa_private.publication_assessment(p.id) assessment,p.public_country
from public.jsa_projects p left join public.public_jsa_metrics m on m.project_id=p.id where p.is_public and jsa_private.community_visible(p.id);


-- Metrics never modify editorial content or its revision date. Counts are per localized article.
create table public.case_study_metrics (
 case_id uuid primary key references public.case_studies(id) on delete cascade,
 view_count bigint not null default 0 check (view_count>=0)
);
alter table public.case_study_metrics enable row level security;
revoke all on public.case_study_metrics from public,anon,authenticated;
grant select on public.case_study_metrics to anon,authenticated;
create policy case_metrics_visible on public.case_study_metrics for select to anon,authenticated
 using (exists(select 1 from public.case_studies c where c.id=case_id));
create table jsa_metrics_private.case_views (
 case_id uuid not null references public.case_studies(id) on delete cascade,
 actor text not null,event_day date not null,
 primary key(case_id,actor,event_day)
);
alter table jsa_metrics_private.case_views enable row level security;
revoke all on jsa_metrics_private.case_views from public,anon,authenticated;
create index case_views_actor_day on jsa_metrics_private.case_views(actor,event_day);
create index case_views_expiry on jsa_metrics_private.case_views(event_day);
-- Private capability: callers can register only one bounded view, not set totals.
create function jsa_metrics_private.record_case_view(p_case_id uuid,p_visitor_id uuid) returns bigint
 language plpgsql security definer set search_path='' as $$
declare
 actor_id uuid:=auth.uid();actor_key text;day_key date:=(now() at time zone 'UTC')::date;added integer;
begin
 if actor_id is null and p_visitor_id is null then return null;end if;
 actor_key:=pg_catalog.md5(day_key::text||case when actor_id is not null then 'u:'||actor_id::text else 'v:'||p_visitor_id::text end);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor_key,518));
 -- case_studies contains only public editorial articles; lock prevents deletion races.
 perform 1 from public.case_studies where id=p_case_id for key share;
 if not found then return null;end if;
 if (select count(*) from jsa_metrics_private.case_views where actor=actor_key and event_day=day_key)<2000 then
  insert into jsa_metrics_private.case_views values(p_case_id,actor_key,day_key) on conflict do nothing;
  get diagnostics added=row_count;
  if added>0 then
   insert into public.case_study_metrics values(p_case_id,1)
    on conflict(case_id) do update set view_count=public.case_study_metrics.view_count+1;
  end if;
 end if;
 -- Keep only the recent deduplication window, retaining aggregate totals.
 delete from jsa_metrics_private.case_views where event_day<day_key-2;
 return coalesce((select view_count from public.case_study_metrics where case_id=p_case_id),0);
end $$;
revoke all on function jsa_metrics_private.record_case_view(uuid,uuid) from public,anon,authenticated;
grant execute on function jsa_metrics_private.record_case_view(uuid,uuid) to anon,authenticated;
create function public.record_case_study_view(p_case_id uuid,p_visitor_id uuid default null) returns bigint
 language sql security invoker set search_path='' as $$select jsa_metrics_private.record_case_view(p_case_id,p_visitor_id)$$;
revoke all on function public.record_case_study_view(uuid,uuid) from public,anon,authenticated;
grant execute on function public.record_case_study_view(uuid,uuid) to anon,authenticated;
notify pgrst,'reload schema';
