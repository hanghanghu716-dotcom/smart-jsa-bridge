-- Public sharing and example-only discovery. Existing grants/RLS remain unchanged.
create or replace function jsa_private.discovery_links(pid uuid default null,lk text default null,lt text default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
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
 and q.public_locale=p.public_locale and q.reuse_license='community-v1'
 -- Examples recommend examples; normal publications never recommend test documents.
 and (q.title ~* '^test[_[:space:]-]') = (p.title ~* '^test[_[:space:]-]')
 order by (select count(*) from unnest(q.tags) t where t=any(p.tags)) desc,q.created_at desc,q.id limit 6) r),'[]'),
 'editorial',coalesce((select jsonb_agg(jsonb_build_object('kind',e.kind,'target',e.target)) from jsa_private.editorial_links e where e.project_id=pid),'[]'));
end $$;

-- New public shares always include the reuse license. Legacy publications are
-- left unlicensed until their owner explicitly confirms sharing.
create or replace function jsa_private.guard_publication() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.is_public and new.reuse_license is distinct from 'community-v1' then
  if tg_op='INSERT' then raise exception 'PUBLICATION_CONSENT_REQUIRED';
  elsif not old.is_public or old.reuse_license='community-v1' then raise exception 'PUBLICATION_CONSENT_REQUIRED'; end if;
 end if;
 if octet_length(new.publication_context::text)>12000 or jsonb_typeof(new.publication_context)<>'object' then raise exception 'INVALID_CONTEXT'; end if;
 new.publication_context=jsonb_build_object('scope',left(coalesce(new.publication_context->>'scope',''),1800),'region',left(coalesce(new.publication_context->>'region',''),120),'limitations',left(coalesce(new.publication_context->>'limitations',''),1800),'sources',left(coalesce(new.publication_context->>'sources',''),1800));
 if tg_op='INSERT' then new.license_accepted_at=case when new.reuse_license='community-v1' then now() else null end;
 elsif new.reuse_license is distinct from old.reuse_license then new.license_accepted_at=case when new.reuse_license='community-v1' then now() else null end;
 else new.license_accepted_at=old.license_accepted_at; end if;
 return new;
end $$;
notify pgrst,'reload schema';
