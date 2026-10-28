-- Transaction-only fixtures: no real account, MFA factor, session or resource persists.
begin;
do $$
declare u uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid(); saved jsonb; payload jsonb; result jsonb; source resource_private.sources;begin
 insert into auth.users(id,aud,role,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
 values(u,'authenticated','authenticated','resource-test-'||u||'@example.invalid','{"role":"admin"}','{}',now(),now());
 insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values(gen_random_uuid(),u,'totp','verified',now(),now());
 insert into auth.sessions(id,user_id,created_at,updated_at) values(sid,u,now(),now());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','aal','aal1','session_id',sid)::text,true);
 begin perform public.resource_admin('list');raise exception 'MFA_BYPASS';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','aal','aal2','session_id',sid)::text,true);
 select * into source from resource_private.sources where id='official-en-us';
 payload:=jsonb_build_object('source_id',source.id,'locale','en-US','url','https://www.osha.gov/resource-fixture-'||u,'title','Resource review fixture','kind','news','topic','general','summary','','evidence_url',source.policy_url);
 begin perform public.resource_admin('publish','',payload);raise exception 'CHECKLIST_BYPASS';exception when others then if sqlerrm<>'PUBLICATION_REVIEW_REQUIRED' then raise;end if;end;
 payload:=payload||'{"checks":{"rights":true,"accuracy":true,"privacy":true,"scope":true}}'::jsonb;
 saved:=public.resource_admin('publish','',payload);
 if not exists(select 1 from jsonb_array_elements(public.resource_hub('en-US')->'items') x where x->>'id'=saved->>'id') then raise exception 'LINK_NOT_PUBLISHED';end if;
 begin perform public.resource_admin('publish',saved->>'id',payload||'{"summary":"Adapted fixture","reuse_confirmed":true}');raise exception 'LICENSE_BYPASS';exception when others then if sqlerrm<>'REUSE_PERMISSION_REQUIRED' then raise;end if;end;
 perform public.resource_admin('source',source.id,jsonb_build_object('active',true,'commercial',true,'adaptation',true,'policy_url',source.policy_url,'policy_note','Transaction-only test permission evidence, not a real licence.'));
 if (select state from resource_private.items where id=(saved->>'id')::uuid)<>'pending' then raise exception 'CHANGED_SOURCE_NOT_INVALIDATED';end if;
 payload:=payload||'{"summary":"Adapted fixture","reuse_confirmed":true}';
 begin perform public.resource_admin('publish',saved->>'id',payload);raise exception 'ATTRIBUTION_BYPASS';exception when others then if sqlerrm<>'ATTRIBUTION_REQUIRED' then raise;end if;end;
 payload:=payload||'{"attribution":"Official test source. Test licence; adapted for this transaction only."}';
 perform public.resource_admin('publish',saved->>'id',payload);
 result:=public.resource_hub('en-US');
 if not exists(select 1 from jsonb_array_elements(result->'items') x where x->>'id'=saved->>'id' and x->>'attribution'=payload->>'attribution') then raise exception 'ATTRIBUTION_NOT_VISIBLE';end if;
 perform public.resource_admin('withdraw',saved->>'id');
 if exists(select 1 from jsonb_array_elements(public.resource_hub('en-US')->'items') x where x->>'id'=saved->>'id') then raise exception 'WITHDRAW_FAILED';end if;
 insert into resource_private.items(source_id,url,title,locale)
 select source.id,'https://www.osha.gov/resource-page-fixture-'||u||'-'||n,'Pagination fixture '||n,'en-US' from generate_series(1,105)n;
 result:=public.resource_admin('list','','{"page":0}');
 if jsonb_array_length(result->'items')<>100 or not (result->>'has_more')::boolean then raise exception 'FIRST_PAGE_FAILED';end if;
 perform public.resource_admin('source','official-ko',jsonb_build_object('active',false,'commercial',false,'adaptation',false,'policy_url','','policy_note','Outbound link only; permission not yet reviewed.'));
 if jsonb_array_length(public.resource_hub('ko')->'items')<>0 then raise exception 'UNREVIEWED_SOURCE_CANNOT_BE_WITHDRAWN';end if;
 result:=public.resource_admin('list','','{"page":1}');
 if jsonb_array_length(result->'items')=0 or (result->>'has_more')::boolean then raise exception 'SECOND_PAGE_FAILED';end if;
end $$;
rollback;
select 'PASS: MFA denial, complete-checklist requirement, link publication, rights/attribution gates, source-change invalidation, withdrawal and admin pagination; all fixtures rolled back' as result;
