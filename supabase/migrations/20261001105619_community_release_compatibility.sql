-- Old deployed clients have no reuse-consent field. Preserve publication writes,
-- but never infer a new license. New UI requires explicit confirmation; server-side
-- metrics/reuse eligibility and indexing continue to exclude unlicensed content.
create or replace function jsa_private.guard_publication() returns trigger language plpgsql set search_path='' as $$
begin
 if octet_length(new.publication_context::text)>12000 or jsonb_typeof(new.publication_context)<>'object' then raise exception 'INVALID_CONTEXT';end if;
 new.publication_context=jsonb_build_object('scope',left(coalesce(new.publication_context->>'scope',''),1800),'region',left(coalesce(new.publication_context->>'region',''),120),'limitations',left(coalesce(new.publication_context->>'limitations',''),1800),'sources',left(coalesce(new.publication_context->>'sources',''),1800));
 if tg_op='INSERT' then new.license_accepted_at=case when new.reuse_license='community-v1' then now() else null end;
 elsif new.reuse_license is distinct from old.reuse_license then new.license_accepted_at=case when new.reuse_license='community-v1' then now() else null end;
 else new.license_accepted_at=old.license_accepted_at;end if;
 return new;
end $$;
notify pgrst,'reload schema';
