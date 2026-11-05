-- Synthetic Singapore source/item verification; no lasting fixture or permission changes.
begin;
do $$
declare token text; result jsonb; fixture uuid;
begin
 select decrypted_secret into token from vault.decrypted_secrets where name='safety_resource_collector';
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 update resource_private.job_sources set enabled=true,review_until=now()+interval '1 day',evidence_url='https://example.invalid/fixture' where id='usajobssg';
 if not found then raise exception 'MISSING_SINGAPORE_SOURCE';end if;
 perform public.job_catalog_collect('commit',token,'usajobssg','[{"external_id":"singapore-fixture","locale":"en-SG","title":"Singapore safety fixture","url":"https://www.usajobs.gov/job/fixture","location":"Singapore"}]','ok');
 select id into fixture from resource_private.job_items where source_id='usajobssg' and external_id='singapore-fixture';
 result=public.job_catalog('en-SG','open','Singapore safety fixture');
 if not exists(select 1 from jsonb_array_elements(result->'items') i where i->>'id'=fixture::text and i->>'source_id'='usajobssg') then raise exception 'SINGAPORE_MISSING';end if;
 if jsonb_array_length(public.job_catalog('en-US','open','Singapore safety fixture')->'items')<>0 then raise exception 'SINGAPORE_LEAK_US';end if;
 if jsonb_array_length(public.job_catalog('en-AU','open','Singapore safety fixture')->'items')<>0 then raise exception 'SINGAPORE_LEAK_AU';end if;
 if not (public.resource_home('en-SG')->>'jobs_connected')::boolean then raise exception 'HOME_NOT_CONNECTED';end if;
 begin
  perform public.job_catalog_collect('commit',token,'usajobssg','[{"external_id":"wrong-country","locale":"en-US","title":"Wrong country","url":"https://www.usajobs.gov/job/fixture"}]','ok');
  raise exception 'WRONG_COUNTRY_ACCEPTED';
 exception when others then if sqlerrm<>'INVALID_ITEM' then raise;end if;end;
 update resource_private.job_items set withdrawn_at=now() where id=fixture;
 perform public.job_catalog_collect('commit',token,'usajobssg','[{"external_id":"singapore-fixture","locale":"en-SG","title":"Singapore safety fixture","url":"https://www.usajobs.gov/job/fixture"}]','ok');
 if jsonb_array_length(public.job_catalog('en-SG','open','Singapore safety fixture')->'items')<>0 then raise exception 'WITHDRAWAL_LOST';end if;
 update resource_private.job_items set withdrawn_at=null,closes_at=now()-interval '1 second' where id=fixture;
 if jsonb_array_length(public.job_catalog('en-SG','closed','Singapore safety fixture')->'items')<>1 then raise exception 'DEADLINE_NOT_CLOSED';end if;
 update resource_private.job_sources set review_until=now()-interval '1 second' where id='usajobssg';
 if jsonb_array_length(public.job_catalog('en-SG','closed','Singapore safety fixture')->'items')<>0 then raise exception 'EXPIRED_PERMISSION';end if;
 if has_table_privilege('anon','resource_private.job_items','select') or has_table_privilege('authenticated','resource_private.job_sources','update') then raise exception 'PRIVATE_ACCESS';end if;
 if has_function_privilege('anon','public.job_catalog_collect(text,text,text,jsonb,text)','execute') or has_function_privilege('authenticated','public.job_catalog_collect(text,text,text,jsonb,text)','execute') then raise exception 'PUBLIC_COLLECTOR';end if;
end $$;
rollback;
select 'PASS: Singapore locale isolation, homepage connection, deadline, withdrawal, permission expiry and collector grants; rolled back' as result;
