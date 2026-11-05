-- Public metadata only; reviewed source gates and all existing grants remain intact.
create or replace function public.job_catalog_collect(p_action text,p_token text,p_source text default '',p_items jsonb default '[]',p_status text default '') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='10s' as $$
declare credential text; s resource_private.job_sources; x jsonb; affected integer:=0; n integer; closing timestamptz; begin
 if auth.role() is distinct from 'service_role' then raise exception 'DENIED' using errcode='42501';end if;
 select decrypted_secret into credential from vault.decrypted_secrets where name='safety_resource_collector';
 if credential is null or p_token is null or extensions.digest(p_token,'sha256')<>extensions.digest(credential,'sha256') then raise exception 'DENIED' using errcode='42501';end if;
 if p_action='claim' then
 with due as (
 select id from resource_private.job_sources
 where enabled and review_until>now() and evidence_url<>''
 and id=adapter and adapter in ('work24','usajobs','narailter','qldsmartjobs','jcyljobs','trudvsem','mhlwjobs','usajobssg')
 and (last_attempt_at is null or last_attempt_at<now()-interval '20 hours')
 order by last_attempt_at nulls first,id limit 7 for update skip locked
 ), claimed as (update resource_private.job_sources source_row set last_attempt_at=now()
 from due where source_row.id=due.id returning source_row.id,source_row.adapter)
 select coalesce(jsonb_agg(to_jsonb(c)),'[]') into x from claimed c;return x;
 elsif p_action='commit' then
 select * into s from resource_private.job_sources where id=p_source and enabled and review_until>now();
 if s.id is null or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>200 then raise exception 'INVALID_SOURCE';end if;
 if p_status is null or p_status not in ('ok','empty','missing_credentials','source_error','invalid_data','partial') then raise exception 'INVALID_STATUS';end if;
 for x in select * from jsonb_array_elements(p_items) loop
 if not resource_private.valid_url(x->>'url',s.hosts) or not coalesce(x->>'locale'=any(s.locales),false)
 or coalesce(length(btrim(x->>'title')),0)=0 or coalesce(length(x->>'external_id'),0)=0 then raise exception 'INVALID_ITEM';end if;
 -- Accept only a fully specified instant. Date-only values must be resolved by the official-source adapter.
 if nullif(x->>'closes_at','') is not null and (x->>'closes_at') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception 'DEADLINE_TIMEZONE_REQUIRED';end if;
 closing=nullif(x->>'closes_at','')::timestamptz;
 insert into resource_private.job_items(source_id,external_id,locale,url,title,employer,location,deadline_text,closes_at,closed_at)
 values(s.id,x->>'external_id',x->>'locale',x->>'url',btrim(x->>'title'),coalesce(x->>'employer',''),coalesce(x->>'location',''),coalesce(x->>'deadline_text',''),closing,
 case when (x->>'source_closed')::boolean then now() end)
 on conflict(source_id,external_id,locale) do update set url=excluded.url,title=excluded.title,employer=excluded.employer,location=excluded.location,
 deadline_text=excluded.deadline_text,closes_at=excluded.closes_at,closed_at=excluded.closed_at,verified_at=now(),updated_at=now()
 where resource_private.job_items.withdrawn_at is null;
 get diagnostics n=row_count;affected=affected+n;
 end loop;
 update resource_private.job_sources set collection_status=p_status,last_success_at=case when p_status in ('ok','empty','partial') then now() else last_success_at end where id=s.id;
 return jsonb_build_object('updated',affected);
 else raise exception 'INVALID_ACTION';end if;
end $$;
revoke all on function public.job_catalog_collect(text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.job_catalog_collect(text,text,text,jsonb,text) to service_role;

-- Independent Singapore source, disabled until its scope/attribution UI is deployed.
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement)
values('usajobssg','USAJOBS · U.S. federal roles in Singapore',array['en-SG'],array['www.usajobs.gov'],'https://www.usajobs.gov/','usajobssg','https://developer.usajobs.gov/apirequest/index','싱가포르 근무 미국 연방기관의 안전 관련 공고만. 기존 개인 승인 USAJOBS 키 이용, 무료 공개 API·재게시 허용. 구조화된 근무 국가 확인 및 미국 시민권 등 지원 제한 안내. 최소 목록 정보만 저장. 일 1회 최대 100건 조회.')
on conflict(id) do update set name=excluded.name,locales=excluded.locales,hosts=excluded.hosts,home_url=excluded.home_url,adapter=excluded.adapter,policy_url=excluded.policy_url,requirement=excluded.requirement;
