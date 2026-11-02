-- Register disabled. No new schedule, permissions, or publication approval.
create or replace function public.job_catalog_collect(p_action text,p_token text,p_source text default '',p_items jsonb default '[]',p_status text default '') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='10s' as $$
declare credential text; s resource_private.job_sources; x jsonb; affected integer:=0; n integer; closing timestamptz; begin
 if auth.role() is distinct from 'service_role' then raise exception 'DENIED' using errcode='42501';end if;
 select decrypted_secret into credential from vault.decrypted_secrets where name='safety_resource_collector';
 if credential is null or p_token is null or extensions.digest(p_token,'sha256')<>extensions.digest(credential,'sha256') then raise exception 'DENIED' using errcode='42501';end if;
 if p_action='claim' then
 with claimed as (update resource_private.job_sources set last_attempt_at=now()
 where enabled and review_until>now() and adapter in ('work24','usajobs','narailter')
 and (last_attempt_at is null or last_attempt_at<now()-interval '20 hours') returning id,adapter)
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
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values ('narailter','나라일터 · 인사혁신처',array['ko'],array['www.gojobs.go.kr'],'https://www.gojobs.go.kr/','narailter','https://www.data.go.kr/data/15156780/openapi.do','공공데이터포털 일반회원 신청 가능 · 무료 · 이용허락범위 제한 없음. 활용신청 승인·서버 인증키 및 실응답 검증 후 활성화. 공공부문 안전·보건 채용 목록만 표시.') on conflict(id) do nothing;
