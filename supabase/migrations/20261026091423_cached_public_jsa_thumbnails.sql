-- Private, revision-addressed thumbnails. Public reads re-check publication and
-- moderation on every request, including when an older URL is known.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('jsa-thumbnails','jsa-thumbnails',false,204800,array['image/webp']);

create table public.jsa_thumbnail_assets (
 project_id uuid primary key references public.jsa_projects(id) on delete cascade,
 revision text not null check(revision ~ '^[a-f0-9]{32}$'),
 renderer text not null default 'risk-v1' check(renderer='risk-v1'),
 width integer not null check(width=720),
 height integer not null check(height between 300 and 1200)
);
alter table public.jsa_thumbnail_assets enable row level security;
revoke all on public.jsa_thumbnail_assets from public,anon,authenticated;
grant select on public.jsa_thumbnail_assets to anon,authenticated;
grant insert,update,delete on public.jsa_thumbnail_assets to authenticated;
grant all on public.jsa_thumbnail_assets to service_role;

create policy thumbnail_metadata_read on public.jsa_thumbnail_assets for select to anon,authenticated using (
 exists(select 1 from public.public_jsa_catalog p where p.id=project_id and p.assessment->>'revision'=revision)
 or exists(select 1 from public.jsa_projects p where p.id=project_id and p.author_id=(select auth.uid()))
);
create policy thumbnail_metadata_insert on public.jsa_thumbnail_assets for insert to authenticated with check (
 exists(select 1 from public.public_jsa_catalog p where p.id=project_id and p.author_id=(select auth.uid()) and p.assessment->>'revision'=revision)
);
create policy thumbnail_metadata_update on public.jsa_thumbnail_assets for update to authenticated using (
 exists(select 1 from public.jsa_projects p where p.id=project_id and p.author_id=(select auth.uid()))
) with check (
 exists(select 1 from public.public_jsa_catalog p where p.id=project_id and p.author_id=(select auth.uid()) and p.assessment->>'revision'=revision)
);
create policy thumbnail_metadata_delete on public.jsa_thumbnail_assets for delete to authenticated using (
 exists(select 1 from public.jsa_projects p where p.id=project_id and p.author_id=(select auth.uid()))
);

-- Invoker function: no elevated permissions and no client-supplied SQL/URL.
create function public.can_read_jsa_thumbnail(object_name text) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.public_jsa_catalog p
 where object_name=p.id::text||'/'||(p.assessment->>'revision')||'/risk-v1.webp'
 and coalesce(p.assessment->>'review','')<>'rejected')
$$;
create function public.owns_jsa_thumbnail(object_name text, current_only boolean) returns boolean
language sql stable security invoker set search_path='' as $$
 select object_name ~ '^[a-f0-9-]{36}/[a-f0-9]{32}/risk-v1[.]webp$' and
 case when current_only then exists(select 1 from public.public_jsa_catalog p
 where p.author_id=(select auth.uid()) and object_name=p.id::text||'/'||(p.assessment->>'revision')||'/risk-v1.webp')
 else exists(select 1 from public.jsa_projects p where p.author_id=(select auth.uid()) and split_part(object_name,'/',1)=p.id::text) end
$$;
revoke all on function public.can_read_jsa_thumbnail(text),public.owns_jsa_thumbnail(text,boolean) from public;
grant execute on function public.can_read_jsa_thumbnail(text) to anon,authenticated,service_role;
grant execute on function public.owns_jsa_thumbnail(text,boolean) to anon,authenticated,service_role;

create policy jsa_thumbnail_read on storage.objects for select to anon,authenticated using (
 bucket_id='jsa-thumbnails' and (public.can_read_jsa_thumbnail(name) or public.owns_jsa_thumbnail(name,false))
);
create policy jsa_thumbnail_insert on storage.objects for insert to authenticated with check (
 bucket_id='jsa-thumbnails' and public.owns_jsa_thumbnail(name,true)
);
create policy jsa_thumbnail_delete on storage.objects for delete to authenticated using (
 bucket_id='jsa-thumbnails' and public.owns_jsa_thumbnail(name,false)
);
-- Existing permissive policies on other buckets cannot widen this bucket.
create policy jsa_thumbnail_read_boundary on storage.objects as restrictive for select to anon,authenticated using (
 bucket_id<>'jsa-thumbnails' or public.can_read_jsa_thumbnail(name) or public.owns_jsa_thumbnail(name,false)
);
create policy jsa_thumbnail_insert_boundary on storage.objects as restrictive for insert to anon,authenticated with check (
 bucket_id<>'jsa-thumbnails' or public.owns_jsa_thumbnail(name,true)
);
create policy jsa_thumbnail_update_boundary on storage.objects as restrictive for update to anon,authenticated
 using (bucket_id<>'jsa-thumbnails') with check (bucket_id<>'jsa-thumbnails');
create policy jsa_thumbnail_delete_boundary on storage.objects as restrictive for delete to anon,authenticated using (
 bucket_id<>'jsa-thumbnails' or public.owns_jsa_thumbnail(name,false)
);

create view public.public_jsa_cards with (security_invoker=true,security_barrier=true) as
 select p.id,p.title,p.author_id,p.is_public,p.public_locale,p.public_country,p.tags,
 p.published_at,p.content_updated_at,p.is_operator,p.document_group_id,p.document_variant,p.assessment,
 left(coalesce(nullif(p.publication_context->>'scope',''),p.analysis_data->0->'proc'->>'stepDetail',p.title),600) as excerpt,
 case when jsonb_typeof(p.analysis_data)='array' then jsonb_array_length(p.analysis_data) else 0 end as step_count,
 p.assessment->>'revision' as revision,
 a.revision as thumbnail_revision,a.width as thumbnail_width,a.height as thumbnail_height
 from public.public_jsa_catalog p
 left join public.jsa_thumbnail_assets a on a.project_id=p.id and a.revision=p.assessment->>'revision' and a.renderer='risk-v1';
revoke all on public.public_jsa_cards from public,anon,authenticated;
grant select on public.public_jsa_cards to anon,authenticated,service_role;
comment on view public.public_jsa_cards is 'Home metadata only. Current public revision thumbnails; no document bodies or private form fields.';
