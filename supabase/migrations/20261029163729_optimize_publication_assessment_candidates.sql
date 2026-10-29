-- Preserve publication visibility, duplicate ordering, review state and privileges.
-- No document rows or access policies are changed.
create or replace function jsa_private.publication_assessment(pid uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare f jsa_private.publication_fingerprints; p public.jsa_projects; duplicate uuid; score real; review text;
begin
 select * into p from public.jsa_projects where id=pid and is_public and jsa_private.community_visible(id);
 if not found then return null; end if;
 select * into f from jsa_private.publication_fingerprints where project_id=pid;
 if not found then return jsonb_build_object('checked',false); end if;
 if length(f.body)>=180 then
  -- Exact hashes sort before every near match in the original query.
  select q.id,public.similarity(x.body,f.body) into duplicate,score
  from jsa_private.publication_fingerprints x join public.jsa_projects q on q.id=x.project_id
  where x.body_hash=f.body_hash and q.is_public and jsa_private.community_visible(q.id)
    and (q.created_at,q.id)<(p.created_at,p.id)
  order by public.similarity(x.body,f.body) desc,q.created_at,q.id limit 1;
  if duplicate is null then
   -- Exclude newer/private/withdrawn documents before comparing long bodies.
   -- Calculate each similarity once, retaining the original 0.93 cutoff.
   with candidates as materialized (
    select q.id,q.created_at,x.body
    from jsa_private.publication_fingerprints x join public.jsa_projects q on q.id=x.project_id
    where q.is_public and jsa_private.community_visible(q.id)
      and (q.created_at,q.id)<(p.created_at,p.id)
   ), scores as materialized (
    select id,created_at,public.similarity(body,f.body) similarity from candidates
   )
   select id,similarity into duplicate,score from scores where similarity>=0.93
   order by similarity desc,created_at,id limit 1;
  end if;
 end if;
 select case when r.revision_hash=f.revision_hash then r.state else 'stale' end into review from jsa_private.publication_reviews r where r.project_id=pid;
 return jsonb_build_object('checked',true,'duplicate_of',duplicate,'similarity',score,'review',coalesce(review,'pending'),'revision',f.revision_hash);
end $$;
