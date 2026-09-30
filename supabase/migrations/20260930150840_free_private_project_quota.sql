-- Maintain counts and install enforcement under one write-blocking migration lock.
lock table public.jsa_projects in share row exclusive mode;
create table jsa_private.project_storage_usage (
 user_id uuid primary key references auth.users(id) on delete cascade,
 private_count bigint not null default 0 check(private_count>=0)
);
alter table jsa_private.project_storage_usage enable row level security;
revoke all on jsa_private.project_storage_usage from public,anon,authenticated;
insert into jsa_private.project_storage_usage(user_id,private_count)
select author_id,count(*) from public.jsa_projects where is_public is not true group by author_id;

-- New records must have one unambiguous owner. Ownership cannot be reassigned.
create function jsa_private.guard_project_owner() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='UPDATE' and (new.author_id is distinct from old.author_id or new.user_id is distinct from old.user_id) then raise exception 'PROJECT_OWNER_IMMUTABLE'; end if;
 if new.author_id is null or new.user_id is distinct from new.author_id then raise exception 'PROJECT_OWNER_INVALID'; end if;
 if auth.uid() is not null and (new.author_id is distinct from auth.uid()) then raise exception 'PROJECT_OWNER_INVALID'; end if;
 return new;
end $$;
revoke all on function jsa_private.guard_project_owner() from public,anon,authenticated;
create trigger phase6_project_owner before insert or update of author_id,user_id on public.jsa_projects
for each row execute function jsa_private.guard_project_owner();

create policy phase6_project_insert_owner on public.jsa_projects as restrictive for insert to authenticated
with check(author_id=(select auth.uid()) and user_id=(select auth.uid()));
create policy phase6_project_update_owner on public.jsa_projects as restrictive for update to authenticated
using(author_id=(select auth.uid()) and user_id=(select auth.uid()))
with check(author_id=(select auth.uid()) and user_id=(select auth.uid()));
create policy phase6_project_delete_owner on public.jsa_projects as restrictive for delete to authenticated
using(author_id=(select auth.uid()) and user_id=(select auth.uid()));
create policy phase6_project_read_owner on public.jsa_projects as restrictive for select to anon,authenticated
using(is_public is true or (author_id=(select auth.uid()) and user_id=(select auth.uid())));
revoke truncate,trigger on public.jsa_projects from anon,authenticated;

-- AFTER triggers count only actual writes (including UPSERT and bulk requests).
-- The conditional UPDATE locks a single counter row and rechecks the latest
-- committed count after waiting. Higher isolation levels fail rather than drift.
create function jsa_private.enforce_project_storage() returns trigger
language plpgsql security definer set search_path='' as $$
declare owner_id uuid; delta integer:=0; unlimited boolean;
begin
 if tg_op='INSERT' then owner_id=new.author_id; delta=case when new.is_public is true then 0 else 1 end;
 elsif tg_op='DELETE' then owner_id=old.author_id; delta=case when old.is_public is true then 0 else -1 end;
 else owner_id=new.author_id; delta=(case when new.is_public is true then 0 else 1 end)-(case when old.is_public is true then 0 else 1 end);
 end if;
 if delta=0 then return null; end if;
 if auth.uid() is not null and owner_id is distinct from auth.uid() then raise exception 'PROJECT_OWNER_INVALID'; end if;
 if delta<0 then
  update jsa_private.project_storage_usage set private_count=private_count-1 where user_id=owner_id;
 else
  insert into jsa_private.project_storage_usage(user_id) values(owner_id) on conflict(user_id) do nothing;
  perform 1 from jsa_private.project_storage_usage where user_id=owner_id for update;
  unlimited=auth.uid() is null or exists(select 1 from public.jsa_beta_access where user_id=owner_id and expires_at>clock_timestamp());
  update jsa_private.project_storage_usage set private_count=private_count+1
   where user_id=owner_id and (unlimited or private_count<3);
  if not found then raise exception using message='FREE_PROJECT_LIMIT',errcode='P0001'; end if;
 end if;
 return null;
end $$;
revoke all on function jsa_private.enforce_project_storage() from public,anon,authenticated;
create trigger phase6_project_storage after insert or delete or update of is_public,author_id,user_id on public.jsa_projects
for each row execute function jsa_private.enforce_project_storage();

create function jsa_private.read_project_storage() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); used bigint; expiry timestamptz; unlimited boolean;
begin
 if actor is null then raise exception 'AUTH_REQUIRED'; end if;
 select coalesce(private_count,0) into used from jsa_private.project_storage_usage where user_id=actor;
 select expires_at into expiry from public.jsa_beta_access where user_id=actor;
 unlimited=coalesce(expiry>clock_timestamp(),false);
 return jsonb_build_object('used',coalesce(used,0),'limit',case when unlimited then null else 3 end,'trial_active',unlimited,'trial_expires_at',expiry,'can_create',unlimited or coalesce(used,0)<3);
end $$;
revoke all on function jsa_private.read_project_storage() from public,anon,authenticated;
grant execute on function jsa_private.read_project_storage() to authenticated;
create function public.get_jsa_storage_usage() returns jsonb
language sql security invoker set search_path='' as $$ select jsa_private.read_project_storage() $$;
revoke all on function public.get_jsa_storage_usage() from public,anon;
grant execute on function public.get_jsa_storage_usage() to authenticated;
