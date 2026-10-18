-- Private preferences are never included in the public author profile.
create table public.profile_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 sector text not null default '' check(length(sector)<=120),
 default_department text not null default '' check(length(default_department)<=120),
 default_manager text not null default '' check(length(default_manager)<=120),
 default_publicity boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.profile_preferences enable row level security;
revoke all on public.profile_preferences from public,anon,authenticated;
grant select on public.profile_preferences to authenticated;
create policy preferences_owner on public.profile_preferences for select to authenticated using(user_id=(select auth.uid()));

create function jsa_private.save_profile_preferences(p_profile jsonb,p_preferences jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) then raise exception 'AUTH_REQUIRED';end if;
 if jsonb_typeof(p_profile)<>'object' or jsonb_typeof(p_preferences)<>'object'
 or length(coalesce(p_profile->>'username','')) not between 1 and 80
 or length(coalesce(p_profile->>'company_name',''))>200 or length(coalesce(p_profile->>'bio',''))>2000 then raise exception 'INVALID_PROFILE';end if;
 update public.profiles set username=trim(p_profile->>'username'),company_name=coalesce(p_profile->>'company_name',''),bio=coalesce(p_profile->>'bio',''),updated_at=now() where id=actor;
 if not found then raise exception 'PROFILE_NOT_FOUND';end if;
 insert into public.profile_preferences(user_id,sector,default_department,default_manager,default_publicity)
 values(actor,coalesce(p_preferences->>'sector',''),coalesce(p_preferences->>'default_department',''),coalesce(p_preferences->>'default_manager',''),coalesce((p_preferences->>'default_publicity')::boolean,false))
 on conflict(user_id) do update set sector=excluded.sector,default_department=excluded.default_department,default_manager=excluded.default_manager,default_publicity=excluded.default_publicity,updated_at=now();
end $$;
create function public.save_profile_preferences(p_profile jsonb,p_preferences jsonb) returns void language sql set search_path='' as $$select jsa_private.save_profile_preferences(p_profile,p_preferences)$$;
revoke all on function jsa_private.save_profile_preferences(jsonb,jsonb),public.save_profile_preferences(jsonb,jsonb) from public,anon;
grant execute on function jsa_private.save_profile_preferences(jsonb,jsonb),public.save_profile_preferences(jsonb,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('profile-assets','profile-assets',false,1048576,array['image/png','image/jpeg']);
create policy profile_asset_owner on storage.objects for all to authenticated
 using(bucket_id='profile-assets' and name=(select auth.uid())::text||'/signature')
 with check(bucket_id='profile-assets' and name=(select auth.uid())::text||'/signature');
create policy profile_asset_boundary on storage.objects as restrictive for all to anon,authenticated
 using(bucket_id<>'profile-assets' or name=(select auth.uid())::text||'/signature')
 with check(bucket_id<>'profile-assets' or name=(select auth.uid())::text||'/signature');

-- Reservations serialize quota decisions before the Storage API accepts bytes.
-- Count the entire per-object maximum for pending uploads; never trust a client size.
create table jsa_private.work_upload_reservations (
 path text primary key,user_id uuid not null references auth.users(id) on delete cascade,
 expires_at timestamptz not null
);
create index work_upload_reservations_owner on jsa_private.work_upload_reservations(user_id,expires_at);
alter table jsa_private.work_upload_reservations enable row level security;
revoke all on jsa_private.work_upload_reservations from public,anon,authenticated;
create function jsa_private.reserve_work_upload(p_path text) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();used_bytes bigint;used_files bigint;pending bigint;total_bytes bigint;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) then raise exception 'AUTH_REQUIRED';end if;
 if p_path is null or p_path !~ ('^'||actor::text||'/(drawings/[0-9a-f-]{36}/source\.(pdf|png|jpg)|outputs/[0-9a-f-]{36}/output\.pdf)$') then raise exception 'WORK_FILE_INVALID';end if;
 perform pg_advisory_xact_lock(18270618);
 -- A retry can verify an already completed, immutable object without allocating more.
 if exists(select 1 from storage.objects where bucket_id='work-bundle-assets' and name=p_path) then return;end if;
 delete from jsa_private.work_upload_reservations where expires_at<now();
 if exists(select 1 from jsa_private.work_upload_reservations where path=p_path) then return;end if;
 select coalesce(sum(case when metadata->>'size' ~ '^[0-9]{1,15}$' and (metadata->>'size')::bigint>0 then (metadata->>'size')::bigint else 41943040 end),0),count(*)
 into used_bytes,used_files from storage.objects where bucket_id='work-bundle-assets' and name like actor::text||'/%';
 select count(*) into pending from jsa_private.work_upload_reservations r where r.user_id=actor and not exists(select 1 from storage.objects o where o.bucket_id='work-bundle-assets' and o.name=r.path);
 if used_bytes+(pending+1)*41943040>262144000 or used_files+pending+1>100 then raise exception 'WORK_STORAGE_QUOTA';end if;
 select coalesce(sum(case when metadata->>'size' ~ '^[0-9]{1,15}$' and (metadata->>'size')::bigint>0 then (metadata->>'size')::bigint else 41943040 end),0) into total_bytes from storage.objects where bucket_id='work-bundle-assets';
 select count(*) into pending from jsa_private.work_upload_reservations r where not exists(select 1 from storage.objects o where o.bucket_id='work-bundle-assets' and o.name=r.path);
 if total_bytes+(pending+1)*41943040>5368709120 then raise exception 'WORK_STORAGE_CAPACITY';end if;
 insert into jsa_private.work_upload_reservations values(p_path,actor,now()+interval '20 minutes');
end $$;
create function public.reserve_work_upload(p_path text) returns void language sql set search_path='' as $$select jsa_private.reserve_work_upload(p_path)$$;
create function jsa_private.work_upload_reserved(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from jsa_private.work_upload_reservations where path=p_path and user_id=auth.uid() and expires_at>now())
$$;
revoke all on function jsa_private.reserve_work_upload(text),public.reserve_work_upload(text),jsa_private.work_upload_reserved(text) from public,anon;
grant execute on function jsa_private.reserve_work_upload(text),public.reserve_work_upload(text),jsa_private.work_upload_reserved(text) to authenticated;
create policy work_assets_quota on storage.objects as restrictive for insert to authenticated
 with check(bucket_id<>'work-bundle-assets' or jsa_private.work_upload_reserved(name));

-- MFA must be backed by the current user, a verified factor, and a live session.
create or replace function jsa_private.community_admin() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(auth.jwt()->>'aal'='aal2'
 and exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin')
 and exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status='verified')
 and exists(select 1 from auth.sessions where user_id=auth.uid() and id::text=auth.jwt()->>'session_id'),false);
$$;
create policy case_admin_insert_mfa on public.case_studies as restrictive for insert to authenticated with check(jsa_private.community_admin());
create policy case_admin_update_mfa on public.case_studies as restrictive for update to authenticated using(jsa_private.community_admin()) with check(jsa_private.community_admin());
create policy case_admin_delete_mfa on public.case_studies as restrictive for delete to authenticated using(jsa_private.community_admin());
create policy blog_admin_insert_mfa on storage.objects as restrictive for insert to authenticated with check(bucket_id<>'blog-images' or jsa_private.community_admin());
create policy blog_admin_update_mfa on storage.objects as restrictive for update to authenticated using(bucket_id<>'blog-images' or jsa_private.community_admin()) with check(bucket_id<>'blog-images' or jsa_private.community_admin());
create policy blog_admin_delete_mfa on storage.objects as restrictive for delete to authenticated using(bucket_id<>'blog-images' or jsa_private.community_admin());

alter function public.handle_new_user() set search_path='';
update storage.buckets set file_size_limit=41943040,allowed_mime_types=array['application/pdf','image/png','image/jpeg','image/webp','image/gif'] where id='blog-images';
revoke execute on function public.handle_new_user() from public,anon,authenticated;
-- The unused legacy statistics function refers to a retired table; close the API.
do $$declare r record;begin
 for r in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='increment_risk_stats' loop
 execute format('revoke execute on function %s from public,anon,authenticated',r.signature);
 execute format('alter function %s set search_path=%L',r.signature,'');
 end loop;
end $$;
notify pgrst,'reload schema';
