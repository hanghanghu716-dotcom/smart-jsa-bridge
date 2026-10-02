create table public.work_packages (
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 120),version_name text not null default 'ver.1' check(length(version_name) between 1 and 80),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=3000000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.work_form_templates (
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 120),data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=1000000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.work_drawings (
 id uuid primary key,user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 120),drawing_number text not null default '' check(length(drawing_number)<=120),revision text not null default '' check(length(revision)<=80),
 object_path text not null unique,mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg')),
 page_count integer not null check(page_count between 1 and 200),file_size bigint not null check(file_size between 1 and 20971520),
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),created_at timestamptz not null default now()
);
create table public.work_outputs (
 id uuid primary key,user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 package_id uuid not null references public.work_packages(id),name text not null check(length(name) between 1 and 180),
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=5000000),
 object_path text not null unique,sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),file_size bigint not null check(file_size between 1 and 41943040),
 created_at timestamptz not null default now()
);
create index work_packages_owner on public.work_packages(user_id,updated_at desc);
create index work_templates_owner on public.work_form_templates(user_id,updated_at desc);
create index work_drawings_owner on public.work_drawings(user_id,created_at desc);
create index work_outputs_owner on public.work_outputs(user_id,created_at desc);
create index work_outputs_package on public.work_outputs(package_id,created_at desc);
alter table public.work_packages enable row level security;
alter table public.work_form_templates enable row level security;
alter table public.work_drawings enable row level security;
alter table public.work_outputs enable row level security;
revoke all on public.work_packages,public.work_form_templates,public.work_drawings,public.work_outputs from public,anon,authenticated;
grant select,insert,update on public.work_packages,public.work_form_templates to authenticated;
grant select,insert on public.work_drawings,public.work_outputs to authenticated;
create policy own_packages on public.work_packages to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_forms on public.work_form_templates to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_drawings on public.work_drawings to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_outputs on public.work_outputs to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create function jsa_private.guard_work_record() returns trigger language plpgsql security definer set search_path='' as $$
declare doc jsonb; documents jsonb; drawing public.work_drawings; actor uuid:=auth.uid();
begin
 if actor is null or new.user_id is distinct from actor then raise exception 'WORK_OWNER_INVALID';end if;
 if tg_op='UPDATE' then
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id then raise exception 'WORK_OWNER_INVALID';end if;
  new.created_at=old.created_at;new.updated_at=clock_timestamp();
 end if;
 if tg_table_name='work_drawings' then
  if new.object_path<>(actor::text||'/drawings/'||new.id::text||'/source.'||(case new.mime_type when 'application/pdf' then 'pdf' when 'image/png' then 'png' else 'jpg' end)) then raise exception 'WORK_PATH_INVALID';end if;
  if not exists(select 1 from storage.objects where bucket_id='work-bundle-assets' and name=new.object_path and (metadata->>'size')::bigint=new.file_size) then raise exception 'WORK_FILE_MISSING';end if;
 elsif tg_table_name='work_outputs' then
  if not exists(select 1 from public.work_packages where id=new.package_id and user_id=actor) then raise exception 'WORK_PACKAGE_INVALID';end if;
  if new.object_path<>actor::text||'/outputs/'||new.id::text||'/output.pdf' then raise exception 'WORK_PATH_INVALID';end if;
  if not exists(select 1 from storage.objects where bucket_id='work-bundle-assets' and name=new.object_path and (metadata->>'size')::bigint=new.file_size) then raise exception 'WORK_FILE_MISSING';end if;
  documents=new.snapshot->'documents';
 elsif tg_table_name='work_packages' then documents=new.data->'documents';
 elsif tg_table_name='work_form_templates' then
  if new.data->>'type' is distinct from 'form' then raise exception 'WORK_TEMPLATE_INVALID';end if;
 end if;
 if tg_table_name in ('work_packages','work_outputs') then
  if jsonb_typeof(documents) is distinct from 'array' or jsonb_array_length(documents)>40 then raise exception 'WORK_DOCUMENTS_INVALID';end if;
  for doc in select * from jsonb_array_elements(documents) loop
   if doc->>'type' is null or doc->>'type' not in ('jsa','form','drawing') then raise exception 'WORK_DOCUMENT_INVALID';end if;
   if doc->>'type'='drawing' then
    select * into drawing from public.work_drawings where id=(doc->>'drawingId')::uuid and user_id=actor;
    if not found then raise exception 'WORK_DRAWING_INVALID';end if;
    if jsonb_typeof(doc->'pages') is distinct from 'array' then raise exception 'WORK_PAGES_INVALID';end if;
    if exists(select 1 from jsonb_array_elements_text(doc->'pages') p where p::integer<1 or p::integer>drawing.page_count) then raise exception 'WORK_PAGES_INVALID';end if;
   end if;
  end loop;
 end if;
 return new;
end $$;
revoke all on function jsa_private.guard_work_record() from public,anon,authenticated;
create trigger guard_work_packages before insert or update on public.work_packages for each row execute function jsa_private.guard_work_record();
create trigger guard_work_templates before insert or update on public.work_form_templates for each row execute function jsa_private.guard_work_record();
create trigger guard_work_drawings before insert on public.work_drawings for each row execute function jsa_private.guard_work_record();
create trigger guard_work_outputs before insert on public.work_outputs for each row execute function jsa_private.guard_work_record();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('work-bundle-assets','work-bundle-assets',false,41943040,array['application/pdf','image/png','image/jpeg']);
create policy work_assets_read on storage.objects for select to authenticated using(bucket_id='work-bundle-assets' and split_part(name,'/',1)=(select auth.uid())::text);
create policy work_assets_insert on storage.objects for insert to authenticated with check(bucket_id='work-bundle-assets' and split_part(name,'/',1)=(select auth.uid())::text and split_part(name,'/',2) in ('drawings','outputs'));
-- Preserve source revisions and archives: no overwrite/delete permission in this bucket.
create policy work_assets_boundary on storage.objects as restrictive for all to anon,authenticated
 using(bucket_id<>'work-bundle-assets' or split_part(name,'/',1)=(select auth.uid())::text)
 with check(bucket_id<>'work-bundle-assets' or split_part(name,'/',1)=(select auth.uid())::text);
create policy work_assets_no_overwrite on storage.objects as restrictive for update to anon,authenticated using(bucket_id<>'work-bundle-assets') with check(bucket_id<>'work-bundle-assets');
create policy work_assets_no_delete on storage.objects as restrictive for delete to anon,authenticated using(bucket_id<>'work-bundle-assets');
notify pgrst,'reload schema';
