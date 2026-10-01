-- Smart JSA Bridge admin hardening
-- Production policy model: public case-study reads, admin-only editorial writes.

alter table public.case_studies enable row level security;

drop policy if exists "Allow public inserts to case_studies" on public.case_studies;
drop policy if exists "Allow public updates to case_studies" on public.case_studies;
drop policy if exists "Allow public deletes to case_studies" on public.case_studies;

drop policy if exists "Admin inserts case_studies" on public.case_studies;
drop policy if exists "Admin updates case_studies" on public.case_studies;
drop policy if exists "Admin deletes case_studies" on public.case_studies;

create policy "Admin inserts case_studies"
on public.case_studies
for insert
to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin updates case_studies"
on public.case_studies
for update
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admin deletes case_studies"
on public.case_studies
for delete
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- RLS blocks client DML, but TRUNCATE is not covered by RLS.
revoke insert, update, delete, truncate on table public.case_studies from anon;
revoke truncate on table public.case_studies from authenticated;

drop policy if exists "Allow public uploads to blog-images" on storage.objects;
drop policy if exists "Admin reads blog-images objects" on storage.objects;
drop policy if exists "Admin uploads blog-images objects" on storage.objects;
drop policy if exists "Admin updates blog-images objects" on storage.objects;
drop policy if exists "Admin deletes blog-images objects" on storage.objects;

-- Storage upload returns object metadata, so the administrator also needs SELECT.
create policy "Admin reads blog-images objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'blog-images'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admin uploads blog-images objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'blog-images'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admin updates blog-images objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'blog-images'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id = 'blog-images'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admin deletes blog-images objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'blog-images'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
