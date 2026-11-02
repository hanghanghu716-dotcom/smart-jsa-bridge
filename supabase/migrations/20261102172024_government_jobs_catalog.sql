-- Separate lifecycle from editorial resources. No existing resource, JSA or Case Study rows change.
create table resource_private.job_sources (
 id text primary key, name text not null, locales text[] not null, hosts text[] not null,
 home_url text not null, adapter text, policy_url text not null default '', requirement text not null,
 enabled boolean not null default false, review_until timestamptz,
 evidence_url text not null default '', review_note text not null default '', checked_by uuid,
 last_attempt_at timestamptz, last_success_at timestamptz, collection_status text
);
create table resource_private.job_items (
 id uuid primary key default gen_random_uuid(), source_id text not null references resource_private.job_sources(id),
 external_id text not null check(length(external_id) between 1 and 160), locale text not null,
 url text not null check(length(url)<=2000), title text not null check(length(title) between 1 and 250),
 employer text not null default '' check(length(employer)<=250), location text not null default '' check(length(location)<=250),
 deadline_text text not null default '' check(length(deadline_text)<=160), closes_at timestamptz,
 closed_at timestamptz, withdrawn_at timestamptz, verified_at timestamptz not null default now(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(source_id,external_id,locale)
);
create index job_items_browse on resource_private.job_items(locale,verified_at desc,id) where withdrawn_at is null;
alter table resource_private.job_sources enable row level security;
alter table resource_private.job_items enable row level security;
revoke all on resource_private.job_sources,resource_private.job_items from public,anon,authenticated,service_role;

create function resource_private.job_status(i resource_private.job_items) returns text
language sql stable set search_path='' as $$
 select case when i.withdrawn_at is not null then 'withdrawn'
 when i.closed_at is not null or i.closes_at<=now() then 'closed'
 when i.verified_at<=now()-interval '48 hours' then 'unconfirmed' else 'open' end;
$$;
revoke all on function resource_private.job_status(resource_private.job_items) from public,anon,authenticated,service_role;

create function public.job_catalog(p_locale text,p_status text default 'open',p_query text default '',p_page integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' set statement_timeout='5s' as $$
declare result jsonb; begin
 if p_status not in ('open','closed','unconfirmed') or p_status is null or p_page not between 0 and 5000 or p_page is null or length(p_query)>120 then raise exception 'INVALID_QUERY';end if;
 with selected as (
 select i.id,i.locale,i.url,i.title,i.employer,i.location,i.deadline_text,i.closes_at,i.closed_at,i.verified_at,
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

create function public.job_catalog_admin(p_action text,p_id text default '',p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' as $$
declare source resource_private.job_sources; page_number integer:=greatest(0,least(5000,coalesce((p_data->>'page')::integer,0))); begin
 if not jsa_private.community_admin() then raise exception 'ADMIN_MFA_REQUIRED' using errcode='42501';end if;
 if p_action='list' then return jsonb_build_object(
 'sources',(select jsonb_agg(to_jsonb(s) order by s.id) from resource_private.job_sources s),
 'items',coalesce((select jsonb_agg(to_jsonb(i)) from(select j.*,resource_private.job_status(j) as status from resource_private.job_items j order by updated_at desc,id limit 50 offset page_number*50)i),'[]'),
 'has_more',(select count(*)>50 from(select 1 from resource_private.job_items limit 51 offset page_number*50)i));
 elsif p_action='approve_source' then
 select * into source from resource_private.job_sources where id=p_id;
 if source.adapter is null then raise exception 'OFFICIAL_CONNECTION_NOT_READY';end if;
 if not coalesce(p_data->'checks' @> '{"publication":true,"commercial":true,"scope":true,"account":true}'::jsonb,false)
 or coalesce(length(btrim(p_data->>'note')),0)<12 or coalesce(p_data->>'evidence','') !~ '^https://[^[:space:]]+$' then raise exception 'SOURCE_PERMISSION_REQUIRED';end if;
 update resource_private.job_sources set enabled=true,review_until=now()+interval '90 days',evidence_url=p_data->>'evidence',review_note=p_data->>'note',checked_by=auth.uid() where id=p_id;
 elsif p_action='suspend_source' then
 update resource_private.job_sources set enabled=false where id=p_id;
 elsif p_action='withdraw' then
 update resource_private.job_items set withdrawn_at=now(),updated_at=now() where id=p_id::uuid;
 elsif p_action='restore' then
 update resource_private.job_items i set withdrawn_at=null,updated_at=now()
 where i.id=p_id::uuid and exists(select 1 from resource_private.job_sources s where s.id=i.source_id and s.enabled and s.review_until>now());
 else raise exception 'INVALID_ACTION';end if;
 if not found then raise exception 'NOT_FOUND';end if;
 insert into resource_private.audit(actor,action,target) values(auth.uid(),'job_'||p_action,p_id);
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.job_catalog_admin(text,text,jsonb) from public,anon;
grant execute on function public.job_catalog_admin(text,text,jsonb) to authenticated;

-- Only the private collector credential may claim a batch or write feed data.
create function public.job_catalog_collect(p_action text,p_token text,p_source text default '',p_items jsonb default '[]',p_status text default '') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='10s' as $$
declare credential text; s resource_private.job_sources; x jsonb; affected integer:=0; n integer; closing timestamptz; begin
 if auth.role() is distinct from 'service_role' then raise exception 'DENIED' using errcode='42501';end if;
 select decrypted_secret into credential from vault.decrypted_secrets where name='safety_resource_collector';
 if credential is null or p_token is null or extensions.digest(p_token,'sha256')<>extensions.digest(credential,'sha256') then raise exception 'DENIED' using errcode='42501';end if;
 if p_action='claim' then
 with claimed as (update resource_private.job_sources set last_attempt_at=now()
 where enabled and review_until>now() and adapter in ('work24','usajobs')
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
-- Sources are seeded disabled below. No new cron, external request or automatic publication is enabled by this migration.

insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('work24','고용24',array['ko'],array['www.work24.go.kr'],'https://www.work24.go.kr/','work24','https://www.work24.go.kr/cm/e/a/0110/selectOpenApiIntro.do','기업회원 API 승인·인증키 및 채용정보 게시 이용 조건 확인 필요.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('usajobs','USAJOBS',array['en-US'],array['www.usajobs.gov'],'https://www.usajobs.gov/','usajobs','https://developer.usajobs.gov/apirequest/index','연방정부 채용만 해당. API 등록·인증키, 승인 용도·출처·비제휴 표기 확인 필요.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('jobbank','Job Bank / Guichet-Emplois',array['en-CA','en-CA-AB','en-CA-ON','en-CA-BC','fr-CA-QC'],array['www.jobbank.gc.ca','www.guichetemplois.gc.ca'],'https://www.jobbank.gc.ca/',null,'','공식 배포 경로·게시 조건 미확인. 각 주의 근무지로 구분해야 하며 캐나다 전체 공고를 주별로 복제하지 않음.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('findajob','Find a job · DWP',array['en-GB'],array['findajob.dwp.gov.uk'],'https://findajob.dwp.gov.uk/',null,'','기업 공고에 Crown copyright를 일괄 적용하지 않음. 공식 연계·게시 조건 확인 필요.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('apsjobs','APS Jobs',array['en-AU'],array['www.apsjobs.gov.au'],'https://www.apsjobs.gov.au/',null,'','호주 연방 공공서비스 채용 후보. 공식 제공 방식·재게시 조건 및 공고별 시간대 확인 필요.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('mycareersfuture','MyCareersFuture',array['en-SG'],array['www.mycareersfuture.gov.sg'],'https://www.mycareersfuture.gov.sg/',null,'https://www.mycareersfuture.gov.sg/terms-of-use/','이용약관에 복제·링크의 사전 서면 허가 요구. 허가 전 링크 노출·자동수집·재게시 비활성.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('arbeitsagentur','Bundesagentur für Arbeit',array['de-DE'],array['www.arbeitsagentur.de'],'https://www.arbeitsagentur.de/jobsuche/',null,'','비공식 Jobsuche API를 사용하지 않음. 공식 연계·재게시 조건 확인 필요.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('hellowork','ハローワーク',array['ja-JP'],array['www.hellowork.mhlw.go.jp'],'https://www.hellowork.mhlw.go.jp/',null,'https://www.hellowork.mhlw.go.jp/info/terms_regist01.html','제공 대상·목적·인터넷 배포 제한 확인 필요. 일반 공개 페이지 크롤링으로 대체하지 않음.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('francetravail','France Travail',array['fr-FR'],array['candidat.francetravail.fr','www.francetravail.fr'],'https://www.francetravail.fr/',null,'https://www.francetravail.fr/informations/informations-legales-et-conditio/conditions-generales-dutilisatio.html','API 재사용 라이선스·현재 신청 가능 여부 확인 필요. 2026-11-03 확인한 data.gouv 안내에서는 API 공개 중단/접근 제한 상태.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('cliclavoro','Cliclavoro · Ministero del Lavoro',array['it-IT'],array['www.cliclavoro.gov.it','cliclavoro.gov.it'],'https://www.cliclavoro.gov.it/',null,'https://cliclavoro.gov.it/privacy-e-social-media-policy','정부 포털의 외부 민간 공고를 자동 재게시하지 않음. 공식 배포·이용 조건 확인 필요.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('empleate','Empléate · SEPE',array['es-ES'],array['www.empleate.gob.es'],'https://www.empleate.gob.es/',null,'https://www.sepe.es/HomeSepe/mas-informacion-contacto/aviso-legal.html','포털 내 파트너 공고의 권리를 별도로 확인해야 함. 공식 채용 데이터 배포 조건 미확인.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('jadarat','جدارات · HRDF',array['ar-SA'],array['jadarat.sa','www.jadarat.sa'],'https://jadarat.sa/',null,'https://www.hrdf.org.sa/en/products-and-services/programs/individuals/other/jadarat/','사우디 국민 대상 플랫폼. 공식 채용 데이터 연계·재게시 조건 미확인; 해외 취업 가능 공고로 단정하지 않음.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('sine','SINE · Emprega Brasil',array['pt-BR'],array['empregabrasil.mte.gov.br'],'https://empregabrasil.mte.gov.br/',null,'https://www.rj.gov.br/trabalho/dados_abertos','정부 SINE 후보. 지역별 공개 자료를 전국 채용 API로 간주하지 않음. 현재 공고 피드와 이용 조건 확인 필요.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('trudvsem','Работа России',array['ru-RU'],array['trudvsem.ru'],'https://trudvsem.ru/',null,'https://trudvsem.ru/opendata','공식 운영 API·재사용·마감 필드 확인 필요. 검색에 노출되는 demo/test 서버는 수집하지 않음.');
insert into resource_private.job_sources(id,name,locales,hosts,home_url,adapter,policy_url,requirement) values('anofm','ANOFM',array['ro-RO'],array['www.anofm.ro','mediere.anofm.ro'],'https://www.anofm.ro/',null,'https://www.anofm.ro/','공식 채용 공고 후보. 통계 보도자료를 개별 채용 공고로 변환하지 않음. 배포·재게시 조건 확인 필요.');
