-- Synthetic fixtures only; all source states, postings and claims roll back.
begin;
do $$
declare token text; claimed jsonb; row_id uuid; result jsonb;
begin
 select decrypted_secret into token from vault.decrypted_secrets where name='safety_resource_collector';
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 update resource_private.job_sources set enabled=true,review_until=now()+interval '1 day',evidence_url='https://example.invalid/fixture',last_attempt_at=null
 where id in ('work24','usajobs','narailter','qldsmartjobs','jcyljobs','trudvsem','mhlwjobs','usajobssg');
 claimed=public.job_catalog_collect('claim',token);
 if jsonb_array_length(claimed)<>7 then raise exception 'SOURCE_STARVATION';end if;
 if jsonb_array_length(public.job_catalog_collect('claim',token))<>1 then raise exception 'EIGHTH_SOURCE_STARVED';end if;
 if jsonb_array_length(public.job_catalog_collect('claim',token))<>0 then raise exception 'DUPLICATE_CLAIM';end if;
 update resource_private.job_sources set last_attempt_at=null,evidence_url='' where id='qldsmartjobs';
 if jsonb_array_length(public.job_catalog_collect('claim',token))<>0 then raise exception 'MISSING_EVIDENCE_CLAIMED';end if;
 update resource_private.job_sources set evidence_url='https://example.invalid/fixture' where id='qldsmartjobs';
 perform public.job_catalog_collect('commit',token,'qldsmartjobs','[{"external_id":"international-test","locale":"en-AU","title":"Electrical safety fixture","url":"https://smartjobs.qld.gov.au/jobs/QLD-fixture"}]','ok');
 select id into row_id from resource_private.job_items where source_id='qldsmartjobs' and external_id='international-test';
 result=public.job_catalog('en-AU','open','Electrical safety fixture');
 if not exists(select 1 from jsonb_array_elements(result->'items') i where i->>'source_id'='qldsmartjobs') then raise exception 'ATTRIBUTION_ID_MISSING';end if;
 if exists(select 1 from jsonb_array_elements(public.job_catalog('en-US','open','Electrical safety fixture')->'items') i where i->>'id'=row_id::text) then raise exception 'COUNTRY_LEAK';end if;
 begin
 perform public.job_catalog_collect('commit',token,'qldsmartjobs','[{"external_id":"wrong-locale","locale":"en-US","title":"Wrong locale","url":"https://smartjobs.qld.gov.au/jobs/QLD-fixture"}]','ok');
 raise exception 'WRONG_LOCALE_ACCEPTED';
 exception when others then if sqlerrm<>'INVALID_ITEM' then raise;end if;end;
 update resource_private.job_items set withdrawn_at=now() where id=row_id;
 perform public.job_catalog_collect('commit',token,'qldsmartjobs','[{"external_id":"international-test","locale":"en-AU","title":"Electrical safety fixture","url":"https://smartjobs.qld.gov.au/jobs/QLD-fixture"}]','ok');
 if exists(select 1 from jsonb_array_elements(public.job_catalog('en-AU','open','Electrical safety fixture')->'items') i where i->>'id'=row_id::text) then raise exception 'WITHDRAWAL_REPUBLISHED';end if;
 perform public.job_catalog_collect('commit',token,'mhlwjobs','[{"external_id":"japan-fixture","locale":"ja-JP","title":"Japan safety fixture","url":"https://www.mhlw.go.jp/stf/kouseiroudoushou/saiyou/ninkituki/fixture.html","deadline_text":"2099-11-27（必着）","closes_at":"2099-11-27T15:00:00Z"}]','ok');
 result=public.job_catalog('ja-JP','open','Japan safety fixture');
 if not exists(select 1 from jsonb_array_elements(result->'items') i where i->>'source_id'='mhlwjobs') then raise exception 'JAPAN_MISSING';end if;
 if jsonb_array_length(public.job_catalog('en-US','open','Japan safety fixture')->'items')<>0 then raise exception 'JAPAN_COUNTRY_LEAK';end if;
 update resource_private.job_items set closes_at=now()-interval '1 second' where source_id='mhlwjobs' and external_id='japan-fixture';
 if jsonb_array_length(public.job_catalog('ja-JP','closed','Japan safety fixture')->'items')<>1 then raise exception 'JAPAN_DEADLINE';end if;
 update resource_private.job_sources set review_until=now()-interval '1 second' where id='mhlwjobs';
 if jsonb_array_length(public.job_catalog('ja-JP','closed','Japan safety fixture')->'items')<>0 then raise exception 'JAPAN_EXPIRED_PERMISSION';end if;
end $$;
rollback;
select 'PASS: eight sources within seven-source claim limit, cooldown, evidence gate, attribution ID, locale isolation and withdrawal; rolled back' as result;
