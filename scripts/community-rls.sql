begin;
-- Run after migration inside one BEGIN ... ROLLBACK transaction. No real notices persist.
-- Supply test.owner as a session setting for a dedicated test account before running.
do $$begin if nullif(current_setting('test.owner',true),'') is null then raise exception 'Missing test.owner account UUID';end if;end $$;
-- Supply test.reporter as a session setting for a dedicated test account before running.
do $$begin if nullif(current_setting('test.reporter',true),'') is null then raise exception 'Missing test.reporter account UUID';end if;end $$;
select set_config('test.admin',(select id::text from auth.users where raw_app_meta_data->>'role'='admin' limit 1),true);
select set_config('test.project',gen_random_uuid()::text,true);
insert into public.jsa_projects(id,author_id,user_id,title,is_public,analysis_data,reuse_license)
values(current_setting('test.project')::uuid,current_setting('test.owner')::uuid,current_setting('test.owner')::uuid,'ROLLBACK ONLY',true,'[]','community-v1');
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.reporter'),true);
select set_config('test.request',(public.community_action('request',current_setting('test.project')::uuid,'{"category":"safety","detail":"Rollback test request only"}')->>'id'),true);
do $$begin
 if (public.community_action('status')->>'admin')::boolean then raise exception 'reporter became admin';end if;
 begin perform public.community_action('queue');raise exception 'queue leak';exception when others then if sqlerrm<>'ACCESS_DENIED' then raise;end if;end;
 begin perform public.community_action('decide',current_setting('test.request')::uuid,'{"decision":"restrict","reason":"Rollback test decision"}');raise exception 'unauthorized decision';exception when others then if sqlerrm<>'ACCESS_DENIED' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
do $$begin
 if exists(select 1 from public.community_requests where id=current_setting('test.request')::uuid) then raise exception 'request privacy leak';end if;
 -- Fourth and later private documents are permitted; ownership remains enforced.
 for i in 1..4 loop insert into public.jsa_projects(author_id,user_id,title,is_public,form_data,analysis_data,participants) values(auth.uid(),auth.uid(),'ROLLBACK PRIVATE',false,'{}','[]','[]');end loop;
 if not (public.get_jsa_storage_usage()->>'community_free')::boolean then raise exception 'free storage unavailable';end if;
 insert into public.jsa_projects(author_id,user_id,title,is_public,form_data,analysis_data,participants,license_accepted_at) values(auth.uid(),auth.uid(),'ROLLBACK UNLICENSED',true,'{}','[]','[]',now());
 if exists(select 1 from public.jsa_projects where author_id=auth.uid() and title='ROLLBACK UNLICENSED' and (reuse_license is not null or license_accepted_at is not null)) then raise exception 'license silently granted';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
select public.community_action('decide',current_setting('test.request')::uuid,'{"decision":"restrict","reason":"Rollback restriction test"}');
select set_config('request.jwt.claim.sub',current_setting('test.reporter'),true);
do $$begin
 if exists(select 1 from public.jsa_projects where id=current_setting('test.project')::uuid) then raise exception 'restricted row leak';end if;
 if not exists(select 1 from public.community_notices where request_id=current_setting('test.request')::uuid) then raise exception 'missing reporter notice';end if;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$begin
 if exists(select 1 from public.public_jsa_catalog where id=current_setting('test.project')::uuid) then raise exception 'catalog leak';end if;
 if exists(select 1 from public.jsa_projects where id=current_setting('test.project')::uuid) then raise exception 'anonymous direct leak';end if;
 if public.record_public_jsa_engagement(current_setting('test.project')::uuid,'view',gen_random_uuid()) is not null then raise exception 'restricted metric leak';end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
do $$begin
 if not exists(select 1 from public.community_notices where request_id=current_setting('test.request')::uuid) then raise exception 'missing author notice';end if;
 if not exists(select 1 from public.jsa_projects where id=current_setting('test.project')::uuid) then raise exception 'owner cannot access restricted document';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
select public.community_action('decide',current_setting('test.request')::uuid,'{"decision":"restore","reason":"Rollback restoration test"}');
reset role;
do $$begin
 if (select count(*) from jsa_private.community_audit where request_id=current_setting('test.request')::uuid)<>2 then raise exception 'audit missing';end if;
end $$;
select 'community RLS checks passed' as result;

rollback;
