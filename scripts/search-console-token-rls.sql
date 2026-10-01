-- All synthetic credentials and aggregate changes are rolled back.
begin;
insert into jsa_private.search_ingest_tokens(name,token_hash,property,providers,expires_at)
values('rollback-scoped-test',encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex'),'https://smartjsabridge.com/',array['google'],now()+interval '1 hour');
do $$
begin
 if has_function_privilege('anon','jsa_private.apply_search_metrics(jsonb)','execute')
 or has_function_privilege('authenticated','jsa_private.apply_search_metrics(jsonb)','execute')
 or has_function_privilege('service_role','jsa_private.apply_search_metrics(jsonb)','execute')
 or has_table_privilege('anon','jsa_private.search_ingest_tokens','select')
 or has_table_privilege('anon','jsa_private.search_daily','select')
 or has_table_privilege('anon','auth.users','select') then raise exception 'EXCESSIVE_PERMISSION'; end if;
end $$;
set local role anon;
do $$
declare batch jsonb:=jsonb_build_object('provider','google','property','https://smartjsabridge.com/','status','success','start',current_date-10,'end',current_date-10,'rows',jsonb_build_array(jsonb_build_object('scope','site','day',current_date-10,'clicks',3,'impressions',10))); result jsonb;
begin
 begin perform public.ingest_search_metrics_token(null,batch); raise exception 'NULL_ALLOWED'; exception when insufficient_privilege then null; end;
 begin perform public.ingest_search_metrics_token(repeat('c',64),batch); raise exception 'INVALID_ALLOWED'; exception when insufficient_privilege then null; end;
 begin perform public.ingest_search_metrics_token(repeat('b',64),jsonb_set(batch,'{property}','"sc-domain:smartjsabridge.com"')); raise exception 'PROPERTY_ALLOWED'; exception when insufficient_privilege then null; end;
 begin perform public.ingest_search_metrics_token(repeat('b',64),jsonb_set(batch,'{provider}','"bing"')); raise exception 'PROVIDER_ALLOWED'; exception when insufficient_privilege then null; end;
 begin perform jsa_private.apply_search_metrics(batch); raise exception 'CORE_ALLOWED'; exception when insufficient_privilege then null; end;
 begin perform public.ingest_search_metrics(batch); raise exception 'LEGACY_ALLOWED'; exception when insufficient_privilege then null; end;
 begin perform public.search_metrics_admin(); raise exception 'ADMIN_ALLOWED'; exception when insufficient_privilege then null; end;
 begin perform public.ingest_search_metrics_token(repeat('b',64),jsonb_set(batch,'{rows,0,clicks}','-1')); raise exception 'INVALID_ROW_ALLOWED'; exception when others then if sqlerrm<>'INVALID_ROW' then raise; end if; end;
end $$;
reset role;
update jsa_private.search_ingest_tokens set expires_at=now()-interval '1 second' where name='rollback-scoped-test';
set local role anon;
do $$ begin begin perform public.ingest_search_metrics_token(repeat('b',64),'{}'); raise exception 'EXPIRED_ALLOWED'; exception when insufficient_privilege then null; end; end $$;
reset role;
update jsa_private.search_ingest_tokens set expires_at=now()+interval '1 hour',revoked_at=now() where name='rollback-scoped-test';
set local role anon;
do $$ begin begin perform public.ingest_search_metrics_token(repeat('b',64),'{}'); raise exception 'REVOKED_ALLOWED'; exception when insufficient_privilege then null; end; end $$;
reset role;
rollback;
