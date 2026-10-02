-- Restore the Community cap without deleting or publishing existing documents.
-- Counters have continued tracking writes since the original quota migration.
-- Existing documents above the cap remain editable; only new private slots are restricted.
create or replace function jsa_private.enforce_project_storage() returns trigger
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
-- Reuse the existing AFTER trigger; ownership and RLS policies remain in place.

create or replace function jsa_private.read_project_storage() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); used bigint; expiry timestamptz; unlimited boolean;
begin
 if actor is null then raise exception 'AUTH_REQUIRED'; end if;
 select coalesce(private_count,0) into used from jsa_private.project_storage_usage where user_id=actor;
 select expires_at into expiry from public.jsa_beta_access where user_id=actor;
 unlimited=coalesce(expiry>clock_timestamp(),false);
 return jsonb_build_object('used',coalesce(used,0),'limit',case when unlimited then null else 3 end,'trial_active',unlimited,'trial_expires_at',expiry,'can_create',unlimited or coalesce(used,0)<3,'community_free',not unlimited);
end $$;

revoke all on function jsa_private.read_project_storage() from public,anon,authenticated;
grant execute on function jsa_private.read_project_storage() to authenticated;
