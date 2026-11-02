-- Entire fixture rolls back. No real credentials, users, postings or approvals change.
begin;
do $$
declare u uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid(); result jsonb; job_id uuid; source_id text:='usajobs'; begin
 perform set_config('request.jwt.claims','{}',true);
 begin perform public.job_catalog_admin('list');raise exception 'ADMIN_BYPASS';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"role":"authenticated"}',true);
 begin perform public.job_catalog_collect('claim','wrong');raise exception 'ROLE_BYPASS';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 begin perform public.job_catalog_collect('claim','wrong');raise exception 'TOKEN_BYPASS';exception when insufficient_privilege then null;end;
 if has_table_privilege('anon','resource_private.job_items','select') or has_table_privilege('authenticated','resource_private.job_sources','update') then raise exception 'RAW_TABLE_ACCESS';end if;
 if has_function_privilege('authenticated','public.job_catalog_collect(text,text,text,jsonb,text)','execute') then raise exception 'COLLECTOR_GRANT';end if;
 insert into auth.users(id,aud,role,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
 values(u,'authenticated','authenticated','jobs-fixture-'||u||'@example.invalid','{"role":"admin"}','{}',now(),now());
 insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values(gen_random_uuid(),u,'totp','verified',now(),now());
 insert into auth.sessions(id,user_id,created_at,updated_at) values(sid,u,now(),now());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','aal','aal1','session_id',sid)::text,true);
 begin perform public.job_catalog_admin('list');raise exception 'MFA_BYPASS';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','aal','aal2','session_id',sid)::text,true);
 begin perform public.job_catalog_admin('approve_source',source_id,'{}');raise exception 'PERMISSION_BYPASS';exception when others then if sqlerrm<>'SOURCE_PERMISSION_REQUIRED' then raise;end if;end;
 begin perform public.job_catalog_admin('approve_source','mycareersfuture','{}');raise exception 'UNSUPPORTED_BYPASS';exception when others then if sqlerrm<>'OFFICIAL_CONNECTION_NOT_READY' then raise;end if;end;
 perform public.job_catalog_admin('approve_source',source_id,'{"checks":{"publication":true,"commercial":true,"scope":true,"account":true},"evidence":"https://www.usajobs.gov/fixture","note":"Transaction fixture only; not a real licence."}');
 insert into resource_private.job_items(source_id,external_id,locale,url,title,closes_at)
 values(source_id,'fixture-'||u,'en-US','https://www.usajobs.gov/job/fixture','Safety officer fixture',now()+interval '1 day') returning id into job_id;
 if not exists(select 1 from jsonb_array_elements(public.job_catalog('en-US')->'items')i where i->>'id'=job_id::text) then raise exception 'OPEN_MISSING';end if;
 if exists(select 1 from jsonb_array_elements(public.job_catalog('ko')->'items')i where i->>'id'=job_id::text) then raise exception 'COUNTRY_LEAK';end if;
 update resource_private.job_items set closes_at=now() where id=job_id;
 if exists(select 1 from jsonb_array_elements(public.job_catalog('en-US')->'items')i where i->>'id'=job_id::text) then raise exception 'EXPIRED_VISIBLE_AS_OPEN';end if;
 if not exists(select 1 from jsonb_array_elements(public.job_catalog('en-US','closed')->'items')i where i->>'id'=job_id::text) then raise exception 'CLOSED_MISSING';end if;
 update resource_private.job_items set closes_at=null,verified_at=now()-interval '49 hours' where id=job_id;
 if not exists(select 1 from jsonb_array_elements(public.job_catalog('en-US','unconfirmed')->'items')i where i->>'id'=job_id::text) then raise exception 'STALE_MISLABELLED';end if;
 perform public.job_catalog_admin('withdraw',job_id::text);
 if exists(select 1 from jsonb_array_elements(public.job_catalog('en-US','unconfirmed')->'items')i where i->>'id'=job_id::text) then raise exception 'WITHDRAWAL_LEAK';end if;
 perform public.job_catalog_admin('restore',job_id::text);
 if not exists(select 1 from jsonb_array_elements(public.job_catalog('en-US','unconfirmed')->'items')i where i->>'id'=job_id::text) then raise exception 'RESTORE_MUST_PRESERVE_STALE_STATE';end if;
 update resource_private.job_items set verified_at=now() where id=job_id;
 update resource_private.job_sources set review_until=now() where id=source_id;
 if exists(select 1 from jsonb_array_elements(public.job_catalog('en-US')->'items')i where i->>'id'=job_id::text) then raise exception 'EXPIRED_PERMISSION_LEAK';end if;
end $$;
rollback;
select 'PASS: private tables, service credential, admin/MFA, source approval, country isolation, deadline boundary, stale state, withdrawal and permission expiry; rolled back' as result;
