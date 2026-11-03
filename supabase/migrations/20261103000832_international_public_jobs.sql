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
 and id=adapter and adapter in ('work24','usajobs','narailter','qldsmartjobs','jcyljobs','trudvsem')
 and (last_attempt_at is null or last_attempt_at<now()-interval '20 hours')
 order by last_attempt_at nulls first,id limit 6 for update skip locked
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

create or replace function public.job_catalog(p_locale text,p_status text default 'open',p_query text default '',p_page integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' set statement_timeout='5s' as $$
declare result jsonb; begin
 if p_status not in ('open','closed','unconfirmed') or p_status is null or p_page not between 0 and 5000 or p_page is null or length(p_query)>120 then raise exception 'INVALID_QUERY';end if;
 with selected as (
 select i.id,i.source_id,i.locale,i.url,i.title,i.employer,i.location,i.deadline_text,i.closes_at,i.closed_at,i.verified_at,
 resource_private.job_status(i) as status,s.name as source
 from resource_private.job_items i join resource_private.job_sources s on s.id=i.source_id
 where i.locale=p_locale and p_locale=any(s.locales) and s.enabled and s.review_until>now()
 and s.evidence_url<>'' and resource_private.valid_url(i.url,s.hosts)
 and resource_private.job_status(i)=p_status
 and (p_query='' or position(lower(p_query) in lower(i.title||' '||i.employer||' '||i.location))>0)
 order by i.verified_at desc,i.id limit 13 offset p_page*12
 ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(x)) from(select * from selected limit 12)x),'[]'),
 'has_more',(select count(*)>12 from selected),'sources',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'connected',s.enabled and s.review_until>now() and s.last_success_at is not null))
 from resource_private.job_sources s where p_locale=any(s.locales)),'[]')) into result;
 return result;
end $$;
revoke all on function public.job_catalog(text,text,text,integer) from public;
grant execute on function public.job_catalog(text,text,text,integer) to anon,authenticated;


insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement)
 values('qldsmartjobs','Smart jobs · Queensland Government',array['en-AU'],array['smartjobs.qld.gov.au'],'https://smartjobs.qld.gov.au/','qldsmartjobs','https://www.qld.gov.au/legal/copyright/','퀸즐랜드 공공부문 한정. 로그인·키 없이 공개 검색 목록 이용. 사이트에서 연결한 CC BY 4.0 조건에 따라 최소 필드·출처·라이선스·지역 범위 표시. 첨부·이미지·본문·외부 사이트는 제외.')
 on conflict(id) do update set name=excluded.name,locales=excluded.locales,hosts=excluded.hosts,home_url=excluded.home_url,adapter=excluded.adapter,policy_url=excluded.policy_url,requirement=excluded.requirement;

insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement)
 values('jcyljobs','Empleo público · Castilla y León',array['es-ES'],array['empleopublico.jcyl.es','datosabiertos.jcyl.es'],'https://empleopublico.jcyl.es/','jcyljobs','https://jcyl.opendatasoft.com/explore/dataset/convocatorias-de-empleo-publico/information/','Castilla y León 공공부문 한정. 공개 API·CC BY 4.0. 계정·키 불필요. 산업안전 관련 공고만, 날짜는 원본 정밀도 유지. 전국·현재 모집 중으로 일괄 표시하지 않음.')
 on conflict(id) do update set name=excluded.name,locales=excluded.locales,hosts=excluded.hosts,home_url=excluded.home_url,adapter=excluded.adapter,policy_url=excluded.policy_url,requirement=excluded.requirement;

insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement)
 values('trudvsem','Работа России · Роструд',array['ru-RU'],array['trudvsem.ru'],'https://trudvsem.ru/','trudvsem','https://trudvsem.ru/opendata/datasets','공식 운영 공개 API·표준 공개데이터 이용조건. 계정·키 불필요. 출처 링크와 최소 항목만 표시. API에 지원 마감일이 없어 원문 확인 표시; hireDate를 마감일로 사용하지 않음.')
 on conflict(id) do update set name=excluded.name,locales=excluded.locales,hosts=excluded.hosts,home_url=excluded.home_url,adapter=excluded.adapter,policy_url=excluded.policy_url,requirement=excluded.requirement;

-- Same single daily invocation; longer network timeout covers the existing 5-page Korean adapter.
create or replace function resource_private.dispatch_jobs() returns bigint
language sql security definer set search_path='' as $$
 select net.http_post(url:='https://aajvezmhyrdawxxbulqz.supabase.co/functions/v1/collect-government-jobs',
 headers:=jsonb_build_object('Content-Type','application/json','x-resource-token',(select decrypted_secret from vault.decrypted_secrets where name='safety_resource_collector')),
 body:='{}'::jsonb,timeout_milliseconds:=100000);
$$;
revoke all on function resource_private.dispatch_jobs() from public,anon,authenticated,service_role;
