-- Thumbnail revision checks do not need the expensive near-duplicate search.
-- Keep public visibility and review checks identical to publication_assessment.
create function jsa_private.publication_thumbnail_state(pid uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare current_revision_hash text; review_state text;
begin
 if not exists(select 1 from public.jsa_projects p
   where p.id=pid and p.is_public and jsa_private.community_visible(p.id)) then return null; end if;
 select f.revision_hash into current_revision_hash from jsa_private.publication_fingerprints f where f.project_id=pid;
 if not found then return jsonb_build_object('checked',false); end if;
 select case when r.revision_hash=current_revision_hash then r.state else 'stale' end into review_state
   from jsa_private.publication_reviews r where r.project_id=pid;
 return jsonb_build_object('checked',true,'revision',current_revision_hash,'review',coalesce(review_state,'pending'));
end $$;
revoke all on function jsa_private.publication_thumbnail_state(uuid) from public;
grant execute on function jsa_private.publication_thumbnail_state(uuid) to anon,authenticated,service_role;

alter policy thumbnail_metadata_read on public.jsa_thumbnail_assets using (
 exists(select 1 from public.public_jsa_catalog p where p.id=project_id
   and jsa_private.publication_thumbnail_state(p.id)->>'revision'=revision)
 or exists(select 1 from public.jsa_projects p where p.id=project_id and p.author_id=(select auth.uid()))
);
alter policy thumbnail_metadata_insert on public.jsa_thumbnail_assets with check (
 exists(select 1 from public.public_jsa_catalog p where p.id=project_id and p.author_id=(select auth.uid())
   and jsa_private.publication_thumbnail_state(p.id)->>'revision'=revision)
);
alter policy thumbnail_metadata_update on public.jsa_thumbnail_assets with check (
 exists(select 1 from public.public_jsa_catalog p where p.id=project_id and p.author_id=(select auth.uid())
   and jsa_private.publication_thumbnail_state(p.id)->>'revision'=revision)
);

create or replace function public.can_read_jsa_thumbnail(object_name text) returns boolean
language sql stable security invoker set search_path='' as $$
 select case when object_name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[a-f0-9]{32}/risk-v1[.]webp$'
 then exists(select 1 from public.public_jsa_catalog p
 where p.id=split_part(object_name,'/',1)::uuid
 and jsa_private.publication_thumbnail_state(p.id)->>'revision'=split_part(object_name,'/',2)
 and coalesce(jsa_private.publication_thumbnail_state(p.id)->>'review','')<>'rejected') else false end
$$;
create or replace function public.owns_jsa_thumbnail(object_name text, current_only boolean) returns boolean
language sql stable security invoker set search_path='' as $$
 select case when object_name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[a-f0-9]{32}/risk-v1[.]webp$'
 then case when current_only then exists(select 1 from public.public_jsa_catalog p
 where p.id=split_part(object_name,'/',1)::uuid and p.author_id=(select auth.uid())
 and jsa_private.publication_thumbnail_state(p.id)->>'revision'=split_part(object_name,'/',2))
 else exists(select 1 from public.jsa_projects p where p.id=split_part(object_name,'/',1)::uuid and p.author_id=(select auth.uid())) end
 else false end
$$;

create or replace view public.public_jsa_cards with (security_invoker=true,security_barrier=false) as
 select p.id,p.title,p.author_id,p.is_public,p.public_locale,p.public_country,p.tags,
 p.published_at,p.content_updated_at,p.is_operator,p.document_group_id,p.document_variant,p.assessment,
 left(coalesce(nullif(p.publication_context->>'scope',''),p.analysis_data->0->'proc'->>'stepDetail',p.title),600) as excerpt,
 case when jsonb_typeof(p.analysis_data)='array' then jsonb_array_length(p.analysis_data) else 0 end as step_count,
 jsa_private.publication_thumbnail_state(p.id)->>'revision' as revision,
 a.revision as thumbnail_revision,a.width as thumbnail_width,a.height as thumbnail_height
 from public.public_jsa_catalog p
 left join public.jsa_thumbnail_assets a on a.project_id=p.id
   and a.revision=jsa_private.publication_thumbnail_state(p.id)->>'revision' and a.renderer='risk-v1';
