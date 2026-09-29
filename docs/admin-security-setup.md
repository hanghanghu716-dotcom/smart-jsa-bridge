# Admin security setup

The former client-side passcode has been removed. Admin access now uses the existing Supabase Auth session plus a server-controlled role in `app_metadata`.

## 1. Treat the former passcode as compromised

It existed in the public repository history. Do not reuse it anywhere.

## 2. Assign the admin role

Run the following in the Supabase SQL Editor after replacing the email with the account that should administer the site:

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'REPLACE_WITH_ADMIN_EMAIL';
```

Then sign out and sign in again so the JWT contains the new app metadata.

To verify:

```sql
select email, raw_app_meta_data
from auth.users
where email = 'REPLACE_WITH_ADMIN_EMAIL';
```

Do not put `role: admin` in user-editable `user_metadata`. The application intentionally checks `app_metadata`.

## 3. Apply the migration

Apply:

`supabase/migrations/20260930_admin_security.sql`

This removes the previous public write policies and replaces them with authenticated administrator-only RLS policies for `case_studies` and the `blog-images` storage bucket. Anonymous INSERT/UPDATE/DELETE/TRUNCATE privileges on `case_studies` are also revoked; public SELECT remains available.

The migration does not change public SELECT/read policies.

## 4. Verify

Signed out:
- case studies should remain readable;
- INSERT/UPDATE/DELETE should fail;
- uploads to `blog-images` should fail.

Signed in as a normal user:
- the admin route should show "관리자 권한이 없습니다";
- case-study writes and `blog-images` writes should fail.

Signed in with `app_metadata.role = admin`:
- `/ko/admin/upload` should open;
- case-study create/edit/delete and asset upload should work.

## 5. Service-role key

Never place a Supabase service-role key in Vite/browser environment variables or the repository. The browser should continue using only the anon/publishable key; RLS is the authorization boundary.
