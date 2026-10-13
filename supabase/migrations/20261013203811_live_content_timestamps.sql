-- Content dates must track real edits, never build times or engagement counters.
-- Existing editorial modification dates are unknown: keep them NULL rather than
-- pretending every historical article changed during this migration.
alter table public.case_studies add column if not exists content_updated_at timestamptz;
alter table public.jsa_projects add column if not exists published_at timestamptz;
alter table public.jsa_projects add column if not exists content_updated_at timestamptz;

update public.jsa_projects set published_at=coalesce(license_accepted_at,created_at)
where is_public and published_at is null;

create or replace function jsa_private.stamp_case_content() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='INSERT' then new.content_updated_at:=statement_timestamp();
 elsif (to_jsonb(new)-'content_updated_at') is distinct from (to_jsonb(old)-'content_updated_at') then
  new.content_updated_at:=statement_timestamp();
 else new.content_updated_at:=old.content_updated_at;
 end if;
 return new;
end $$;
revoke all on function jsa_private.stamp_case_content() from public,anon,authenticated;
drop trigger if exists stamp_case_content on public.case_studies;
create trigger stamp_case_content before insert or update on public.case_studies
for each row execute function jsa_private.stamp_case_content();

create or replace function jsa_private.stamp_public_content() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='INSERT' then
  new.published_at:=case when new.is_public then statement_timestamp() else null end;
  new.content_updated_at:=statement_timestamp();
 else
  new.published_at:=case when new.is_public and not old.is_public then statement_timestamp() else old.published_at end;
  if row(new.title,new.is_public,new.public_locale,new.public_country,new.form_data,new.analysis_data,new.custom_layout,new.tags,new.reuse_license,new.publication_context)
   is distinct from row(old.title,old.is_public,old.public_locale,old.public_country,old.form_data,old.analysis_data,old.custom_layout,old.tags,old.reuse_license,old.publication_context)
  then new.content_updated_at:=statement_timestamp();
  else new.content_updated_at:=old.content_updated_at;
  end if;
 end if;
 return new;
end $$;
revoke all on function jsa_private.stamp_public_content() from public,anon,authenticated;
drop trigger if exists stamp_public_content on public.jsa_projects;
create trigger stamp_public_content before insert or update on public.jsa_projects
for each row execute function jsa_private.stamp_public_content();

create index if not exists case_studies_slug_locale_id on public.case_studies(post_group_id,language_code,id);
create index if not exists case_studies_locale_id on public.case_studies(language_code,id);
create index if not exists jsa_public_country_published on public.jsa_projects(public_country,published_at desc,id) where is_public;

-- Append dates without changing the existing public visibility or RLS rules.
create or replace view public.public_jsa_catalog with(security_invoker=true) as
select p.id,p.title,p.author_id,p.is_public,p.public_locale,p.form_data,p.analysis_data,p.custom_layout,p.tags,p.created_at,p.updated_at,p.scrap_count,
 coalesce(m.view_count,0) view_count,coalesce(m.reuse_count,0) reuse_count,p.reuse_license,p.publication_context,p.license_accepted_at,
 case when exists(select 1 from public.jsa_projects source where source.id=p.parent_id and source.is_public and jsa_private.community_visible(source.id)) then p.parent_id else null end parent_id,
 (select count(*) from public.jsa_projects child where child.parent_id=p.id and child.is_public and jsa_private.community_visible(child.id)) fork_count,
 jsa_private.publication_assessment(p.id) assessment,p.public_country,p.published_at,p.content_updated_at
from public.jsa_projects p left join public.public_jsa_metrics m on m.project_id=p.id where p.is_public and jsa_private.community_visible(p.id);
notify pgrst,'reload schema';
