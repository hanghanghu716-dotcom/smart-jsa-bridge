-- Run through a privileged SQL connection. All changes are rolled back;
-- other sessions never see the test restriction or in-app notices.
begin;
create temporary table moderation_test as
 select p.id,md5(to_jsonb(p)::text) as original,
  (select id from auth.users where raw_app_meta_data->>'role'='admin' limit 1) as admin_id,
  (select id from auth.users where coalesce(raw_app_meta_data->>'role','')<>'admin' limit 1) as user_id,
  (select count(*) from jsa_private.community_audit where project_id=p.id) as audits,
  (select count(*) from public.community_notices where project_id=p.id) as notices
 from public.jsa_projects p where p.is_public and jsa_private.community_visible(p.id) limit 1;
grant select on moderation_test to authenticated,anon;
select set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true) from moderation_test;
set local role authenticated;
do $$declare pid uuid; state jsonb; changed jsonb; begin
 select id into strict pid from moderation_test;
 state:=public.explore_moderation('inspect',pid);
 if (state->>'restricted')::boolean then raise exception 'EXPECTED_VISIBLE'; end if;
 begin
  perform public.explore_moderation('restrict',pid,state||'{"reason":"short"}');
  raise exception 'SHORT_REASON_ACCEPTED';
 exception when others then if sqlerrm<>'INVALID_REASON' then raise; end if; end;
 perform public.explore_moderation('restrict',pid,state||'{"reason":"Transactional moderation verification"}');
 if exists(select 1 from public.public_jsa_catalog where id=pid) then raise exception 'PUBLIC_LEAK'; end if;
 if not (public.explore_moderation('restricted') @> jsonb_build_array(jsonb_build_object('id',pid))) then raise exception 'RESTORE_LIST_MISSING'; end if;
 changed:=public.explore_moderation('document',pid);
 if not (changed->>'restricted')::boolean or changed#>>'{document,id}'<>pid::text then raise exception 'ADMIN_PREVIEW_MISSING'; end if;
 perform public.explore_moderation('restore',pid,changed||'{"reason":"Transactional restore verification"}');
 if not exists(select 1 from public.public_jsa_catalog where id=pid) then raise exception 'RESTORE_FAILED'; end if;
 begin
  perform public.explore_moderation('restrict',pid,state||'{"reason":"Stale state must not be accepted"}');
  raise exception 'STALE_ACCEPTED';
 exception when others then if sqlerrm<>'STALE_MODERATION' then raise; end if; end;
 -- Leave it restricted inside this transaction to verify public access below.
 state:=public.explore_moderation('inspect',pid);
 perform public.explore_moderation('restrict',pid,state||'{"reason":"Verify ordinary and anonymous visibility"}');
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',user_id,'role','authenticated','app_metadata',jsonb_build_object('role','admin'))::text,true) from moderation_test;
set local role authenticated;
do $$declare pid uuid; action text; begin
 select id into strict pid from moderation_test;
 if exists(select 1 from public.public_jsa_catalog where id=pid) then raise exception 'USER_LEAK'; end if;
 foreach action in array array['inspect','document','restricted','restrict','restore'] loop
  begin
   perform public.explore_moderation(action,pid,'{"reason":"Forged admin claim must be rejected"}');
   raise exception 'USER_ALLOWED';
  exception when insufficient_privilege then null; end;
 end loop;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$begin
 if exists(select 1 from public.public_jsa_catalog where id=(select id from moderation_test)) then raise exception 'ANON_LEAK'; end if;
 begin
  perform public.explore_moderation('restricted');
  raise exception 'ANON_ALLOWED';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$begin
 if exists(select 1 from moderation_test t join public.jsa_projects p using(id) where md5(to_jsonb(p)::text)<>t.original) then raise exception 'ORIGINAL_CHANGED'; end if;
 if exists(select 1 from moderation_test t where (select count(*) from jsa_private.community_audit a where a.project_id=t.id)<>t.audits+3) then raise exception 'AUDIT_MISSING'; end if;
 if exists(select 1 from moderation_test t where (select count(*) from public.community_notices n where n.project_id=t.id)<>t.notices+3) then raise exception 'NOTICE_MISSING'; end if;
end $$;
select 'PASS: admin restrict/restore, stale state, reason, audit, original preservation, user/anonymous denial' as result;
rollback;
