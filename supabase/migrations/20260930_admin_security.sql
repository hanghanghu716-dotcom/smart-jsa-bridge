-- Smart JSA Bridge admin hardening
-- Apply with Supabase migrations/SQL editor after assigning at least one admin.
-- The restrictive policies below are intentionally ANDed with any existing permissive policies.

alter table public.case_studies enable row level security;

drop policy if exists "case_studies_admin_insert_guard" on public.case_studies;
drop policy if exists "case_studies_admin_update_guard" on public.case_studies;
drop policy if exists "case_studies_admin_delete_guard" on public.case_studies;
drop policy if exists "case_studies_admin_insert_grant" on public.case_studies;
drop policy if exists "case_studies_admin_update_grant" on public.case_studies;
drop policy if exists "case_studies_admin_delete_grant" on public.case_studies;

create policy "case_studies_admin_insert_guard"
on public.case_studies
as restrictive
for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "case_studies_admin_update_guard"
on public.case_studies
as restrictive
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "case_studies_admin_delete_guard"
on public.case_studies
as restrictive
for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- These permissive policies guarantee that an admin has a positive write policy.
-- Restrictive guards above ensure other permissive policies cannot bypass the role check.
create policy "case_studies_admin_insert_grant"
on public.case_studies
for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "case_studies_admin_update_grant"
on public.case_studies
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "case_studies_admin_delete_grant"
on public.case_studies
for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Protect writes to the existing public editorial asset bucket without affecting other buckets.
drop policy if exists "blog_images_admin_insert_guard" on storage.objects;
drop policy if exists "blog_images_admin_update_guard" on storage.objects;
drop policy if exists "blog_images_admin_delete_guard" on storage.objects;
drop policy if exists "blog_images_admin_insert_grant" on storage.objects;
drop policy if exists "blog_images_admin_update_grant" on storage.objects;
drop policy if exists "blog_images_admin_delete_grant" on storage.objects;

create policy "blog_images_admin_insert_guard"
on storage.objects
as restrictive
for insert
to authenticated
with check (
  bucket_id <> 'blog-images'
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "blog_images_admin_update_guard"
on storage.objects
as restrictive
for update
to authenticated
using (
  bucket_id <> 'blog-images'
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id <> 'blog-images'
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "blog_images_admin_delete_guard"
on storage.objects
as restrictive
for delete
to authenticated
using (
  bucket_id <> 'blog-images'
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "blog_images_admin_insert_grant"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'blog-images'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "blog_images_admin_update_grant"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'blog-images'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id = 'blog-images'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "blog_images_admin_delete_grant"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'blog-images'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
