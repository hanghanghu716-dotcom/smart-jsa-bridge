-- Run as database owner. All synthetic data is rolled back.
begin;
do $$
declare sample_day date:=current_date-10; batch jsonb; result jsonb; admin_id uuid; member_id uuid;
begin
 if has_function_privilege('anon','public.ingest_search_metrics(jsonb)','execute') or has_function_privilege('authenticated','public.ingest_search_metrics(jsonb)','execute') then raise exception 'INGEST_EXPOSED'; end if;
 if has_function_privilege('anon','public.search_metrics_admin(text,jsonb)','execute') then raise exception 'ADMIN_EXPOSED'; end if;
 if has_table_privilege('authenticated','jsa_private.search_daily','select') then raise exception 'TABLE_EXPOSED'; end if;
 perform set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000000"}',true);
 begin perform public.ingest_search_metrics('{}'); raise exception 'INGEST_ALLOWED'; exception when insufficient_privilege then null; end;
 begin perform public.search_metrics_admin(); raise exception 'ADMIN_ALLOWED'; exception when insufficient_privilege then null; end;
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 -- Isolate test fixtures inside this rolled-back transaction.
 delete from jsa_private.search_daily; delete from jsa_private.search_sync_state;
 batch:=jsonb_build_object('provider','google','property','sc-domain:smartjsabridge.com','status','success','start',sample_day,'end',sample_day,'rows',jsonb_build_array(jsonb_build_object('scope','site','day',sample_day,'clicks',3,'impressions',10),jsonb_build_object('scope','discovery','day',sample_day,'clicks',2,'impressions',5)));
 perform public.ingest_search_metrics(batch); perform public.ingest_search_metrics(batch);
 if (select count(*) from jsa_private.search_daily)<>2 then raise exception 'NOT_IDEMPOTENT'; end if;
 perform public.ingest_search_metrics(jsonb_build_object('provider','google','property','sc-domain:smartjsabridge.com','status','error','code','AUTH_ERROR'));
 if (select sum(clicks) from jsa_private.search_daily)<>5 then raise exception 'ERROR_ERASED_DATA'; end if;
 if (select succeeded_at from jsa_private.search_sync_state where provider='google') is null then raise exception 'LOST_LAST_SUCCESS'; end if;
 begin perform public.ingest_search_metrics(jsonb_set(batch,'{rows,0,clicks}','-1')); raise exception 'INVALID_ACCEPTED'; exception when others then if sqlerrm='INVALID_ACCEPTED' then raise; end if; end;
 if (select sum(clicks) from jsa_private.search_daily)<>5 then raise exception 'NON_ATOMIC_WRITE'; end if;
 select id into admin_id from auth.users where raw_app_meta_data->>'role'='admin' limit 1;
 select id into member_id from auth.users where coalesce(raw_app_meta_data->>'role','')<>'admin' limit 1;
 if admin_id is null or member_id is null then raise exception 'ADMIN_AND_MEMBER_FIXTURES_REQUIRED'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',member_id)::text,true);
 begin perform public.search_metrics_admin(); raise exception 'MEMBER_ALLOWED'; exception when insufficient_privilege then null; end;
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',admin_id)::text,true);
 result:=public.search_metrics_admin();
 if jsonb_array_length(result->'monthly')<>2 then raise exception 'DASHBOARD_FAILED'; end if;
 perform public.search_metrics_admin('naver_month',jsonb_build_object('month',(date_trunc('month',current_date)-interval '1 month')::date,'clicks',0,'impressions',null,'source','Synthetic rollback test'));
 if not exists(select 1 from jsa_private.search_manual_months where clicks=0 and impressions is null and source='Synthetic rollback test') then raise exception 'NULL_AND_ZERO_LOST'; end if;
 -- Privileges come from live app_metadata, so revocation takes effect immediately.
 update auth.users set raw_app_meta_data=raw_app_meta_data-'role' where id=admin_id;
 begin perform public.search_metrics_admin(); raise exception 'STALE_ADMIN_ALLOWED'; exception when insufficient_privilege then null; end;
end $$;
rollback;
