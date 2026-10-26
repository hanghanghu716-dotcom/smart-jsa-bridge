-- Keep table RLS and invoker permissions; this view adds no visibility filter.
-- A barrier here forced assessment calculation for every country row before LIMIT.
alter view public.public_jsa_cards set (security_barrier=false);

create or replace function public.can_read_jsa_thumbnail(object_name text) returns boolean
language sql stable security invoker set search_path='' as $$
 select case when object_name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[a-f0-9]{32}/risk-v1[.]webp$'
 then exists(select 1 from public.public_jsa_catalog p
 where p.id=split_part(object_name,'/',1)::uuid
 and p.assessment->>'revision'=split_part(object_name,'/',2)
 and coalesce(p.assessment->>'review','')<>'rejected') else false end
$$;
create or replace function public.owns_jsa_thumbnail(object_name text, current_only boolean) returns boolean
language sql stable security invoker set search_path='' as $$
 select case when object_name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[a-f0-9]{32}/risk-v1[.]webp$'
 then case when current_only then exists(select 1 from public.public_jsa_catalog p
 where p.id=split_part(object_name,'/',1)::uuid and p.author_id=(select auth.uid())
 and p.assessment->>'revision'=split_part(object_name,'/',2))
 else exists(select 1 from public.jsa_projects p where p.id=split_part(object_name,'/',1)::uuid and p.author_id=(select auth.uid())) end
 else false end
$$;
