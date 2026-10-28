-- Collection permission is separate from public republication permission.
-- Private registry only: operator publication forms cannot change fetch hosts.
alter table resource_private.sources add column collection jsonb not null default '{}';
alter table resource_private.items add column collection_provenance jsonb not null default '{}';

create or replace function public.resource_collect(p_action text,p_token text,p_source text default '',p_items jsonb default '[]',p_status text default '') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='10s' as $$
declare credential text; s resource_private.sources; x jsonb; inserted_count integer:=0; n integer; placeholder text; url_path text;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'DENIED' using errcode='42501';end if;
 select decrypted_secret into credential from vault.decrypted_secrets where name='safety_resource_collector';
 if credential is null or p_token is null or extensions.digest(p_token,'sha256')<>extensions.digest(credential,'sha256') then raise exception 'DENIED' using errcode='42501';end if;
 if p_action='claim' then
 update resource_private.collector_state set lease_until=now()+interval '20 hours' where id and lease_until<now();
 if not found then return '[]';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'domains',domains,'collection',collection) order by id)
 from resource_private.sources where active and review_until>now() and collection->>'enabled'='true'
 and (collection->>'review_until')::timestamptz>now()),'[]');
 elsif p_action='commit' then
 select * into s from resource_private.sources where id=p_source and active and review_until>now()
 and collection->>'enabled'='true' and (collection->>'review_until')::timestamptz>now();
 if s.id is null or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>40 then raise exception 'INVALID_SOURCE';end if;
 placeholder=left(s.name||' — link awaiting review',250);
 for x in select * from jsonb_array_elements(p_items) loop
 if not resource_private.valid_url(x->>'url',s.domains) then raise exception 'INVALID_URL';end if;
 url_path=substring(x->>'url' from '^https://[^/]+([^?#]*)');
 if jsonb_array_length(coalesce(s.collection->'item_prefixes','[]'))>0 and not exists
 (select 1 from jsonb_array_elements_text(s.collection->'item_prefixes') p where starts_with(url_path,p)) then raise exception 'INVALID_PATH';end if;
 insert into resource_private.items(source_id,url,title,locale,source_date,collection_provenance)
 values(s.id,x->>'url',case when s.collection->>'mode'='feed' then x->>'title' else placeholder end,
 s.locales[1],nullif(x->>'source_date','')::date,
 jsonb_build_object('mode',s.collection->>'mode','collected_at',now(),'endpoint',s.collection->>'url',
 'permission_evidence',s.collection->'evidence_urls','placeholder',case when s.collection->>'mode'<>'feed' then placeholder else null end))
 on conflict(url) do nothing;
 get diagnostics n=row_count;inserted_count=inserted_count+n;
 end loop;
 update resource_private.sources set last_collected_at=now(),collection_status=case
 when p_status in ('ok','empty') or p_status ~ '^(SOURCE_|FEED_|ROBOTS_|INVALID_|UNSAFE_|RUN_)[A-Z0-9_]+$' then left(p_status,80)
 else 'COLLECTION_FAILED' end where id=s.id;
 return jsonb_build_object('ok',true,'inserted',inserted_count);
 else raise exception 'INVALID_ACTION';end if;
end $$;

create function resource_private.check_collected_publication() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.state='published' and new.collection_provenance->>'mode' in ('links','feed-links')
 and (btrim(new.title)=new.collection_provenance->>'placeholder' or length(btrim(new.title))<8)
 then raise exception 'ORIGINAL_LINK_LABEL_REQUIRED';end if;
 return new;
end $$;
create trigger collected_publication_review before insert or update on resource_private.items
for each row execute function resource_private.check_collected_publication();
revoke all on function resource_private.check_collected_publication() from public,anon,authenticated,service_role;

create or replace function resource_private.dispatch_collection() returns bigint language sql security definer set search_path='' as $$
 select net.http_post(url:='https://aajvezmhyrdawxxbulqz.supabase.co/functions/v1/collect-safety-resources',
 headers:=jsonb_build_object('Content-Type','application/json','x-resource-token',(select decrypted_secret from vault.decrypted_secrets where name='safety_resource_collector')),
 body:='{}'::jsonb,timeout_milliseconds:=120000);
$$;

-- Reviewed registry, 2026-10-28. New rows are sources, never public articles.
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"feed","url":"https://press.hse.gov.uk/feed/","evidence_urls":["https://www.hse.gov.uk/help/copyright.htm"],"note":"공식 RSS의 제목·주소·날짜만 수집. 본문·사진 제외. / Official RSS metadata only; no body or images."}'::jsonb where id='official-en-gb';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"links","url":"https://www.safeworkaustralia.gov.au/media-centre/news","evidence_urls":["https://www.safeworkaustralia.gov.au/copyright"],"note":"공식 최신 소식의 주소만 수집. RSS의 오래된 항목에 의존하지 않음. / Current official news links only; no copied text.","item_prefixes":["/media-centre/news/"]}'::jsonb where id='official-en-au';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"MOM은 내부 페이지 링크에 사전 서면 허가가 필요합니다. / MOM requires prior permission for deep links."}'::jsonb where id='official-en-sg';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"기존 CCOHS 법령 RSS가 오류이고 다른 피드는 비어 있습니다. 새 공식 피드 확인 필요. / Advertised legislation feed unavailable; alternate feed empty."}'::jsonb where id='official-en-ca';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"공식 OHS RSS 서버가 robots.txt로 자동 접근을 차단합니다. / Official OHS RSS host disallows automated access."}'::jsonb where id='official-en-ca-ab';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"새 소식은 별도 Ontario Labour RSS 출처에서 수집합니다. / Updates use separate Ontario Labour feed."}'::jsonb where id='official-en-ca-on';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"links","url":"https://www.worksafebc.com/en/about-us/news-events","evidence_urls":["https://www.worksafebc.com/en/legal/terms-of-use"],"note":"정보 제공 링크만 수집. 본문·제목·로고 복제 금지. / Informational links only; no copied text, titles or logos.","item_prefixes":["/en/about-us/news-events/announcements/","/about-us/news-events/announcements/","/en/about-us/news-events/news-releases/","/about-us/news-events/news-releases/"]}'::jsonb where id='official-en-ca-bc';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"CNESST의 자동 접근과 재사용 허가를 확인하지 못해 중지했습니다. / Access / reuse permission not verified; collection disabled."}'::jsonb where id='official-fr-ca-qc';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"법령 원문은 기존 링크 유지. 새 소식은 별도 DGUV 출처에서 수집합니다. / News collected from separate DGUV source."}'::jsonb where id='official-de-de';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"links","url":"https://www.inrs.fr/actualites.html","evidence_urls":["https://www.inrs.fr/footer/mentions-legales.html"],"note":"링크 허용 조항에 따라 주소만 수집. / Link permission only; no copied text.","item_prefixes":["/actualites/"]}'::jsonb where id='official-fr-fr';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"법령 원문은 기존 링크 유지. 새 소식은 별도 INAIL 출처에서 수집합니다. / News collected from separate INAIL source."}'::jsonb where id='official-it-it';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"links","url":"https://www.insst.es/noticias-insst","evidence_urls":["https://www.insst.es/informacion-general/aviso-legal"],"note":"공식 소식 주소만 수집. 개별 자료의 이용 조건 검수 필요. / Official news links only; item-specific rights review required.","item_prefixes":["/noticias-insst/"]}'::jsonb where id='official-es-es';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"links","url":"https://www.mhlw.go.jp/hourei/new/tsuchi/newindex.html","evidence_urls":["https://www.mhlw.go.jp/chosakuken/"],"note":"RSS 재배포는 사용하지 않음. 공식 노동기준국 공지 목록의 주소만 수집. PDF 다운로드 없음. / Labour notices links only; RSS redistribution not used; PDFs not downloaded.","item_prefixes":["/hourei/doc/tsuchi/"],"section_start":"tu_5","section_end":"tu_6"}'::jsonb where id='official-ja-jp';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"법령 원문은 기존 링크 유지. 새 소식은 별도 고용노동부 출처에서 수집합니다. / Updates collected from separate MOEL source."}'::jsonb where id='official-ko';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"links","url":"https://www.gov.br/trabalho-e-emprego/pt-br","evidence_urls":["https://www.gov.br/trabalho-e-emprego/pt-br"],"note":"BY-ND 조건. 뉴스 주소만 수집하며 본문 번역·변경 없음. / BY-ND; news URLs only, no translation or adaptation.","item_prefixes":["/trabalho-e-emprego/pt-br/noticias-e-conteudo/"],"min_segments":6}'::jsonb where id='official-pt-br';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"feed-links","url":"https://mintrud.gov.ru/document/rss","evidence_urls":["https://mintrud.gov.ru/docs"],"note":"공식 RSS 주소·날짜만 수집. 현재 DNS 연결 오류는 상태에 표시하고 우회하지 않음. / Official feed links only; DNS failures reported without bypass."}'::jsonb where id='official-ru-ru';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"links","url":"https://www.hrsd.gov.sa/media-center/news","evidence_urls":["https://www.hrsd.gov.sa/how-use"],"note":"정보 링크만 수집. 공식 기관의 보증으로 표현 금지. 노동 외 주제는 검수 때 제외. / Informational links only; no endorsement; exclude unrelated ministry news.","item_prefixes":["/media-center/news/"]}'::jsonb where id='official-ar-sa';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"공식 노동감독기관의 수집·재사용 조건 확인이 필요합니다. / Collection and reuse terms require verification."}'::jsonb where id='official-ro-ro';
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":false,"note":"OSHA RSS 접근 오류로 별도의 DOL 출처를 사용합니다. / Separate DOL feed used because OSHA feed access fails."}'::jsonb where id='official-en-us';
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note) values('news-en-us-dol','US Department of Labor',array['en-US'],array['www.dol.gov'],'https://www.dol.gov/rss','https://www.dol.gov/general/aboutdol/copyright','Official DOL RSS; only OSHA release URLs. No automatic reuse permission for third-party content.');
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"feed-links","url":"https://www.dol.gov/rss/releases.xml","evidence_urls":["https://www.dol.gov/rss","https://www.dol.gov/general/aboutdol/copyright"],"note":"OSHA 보도자료 주소·날짜만 수집. / OSHA release URLs and dates only.","item_prefixes":["/newsroom/releases/osha/"]}'::jsonb where id='news-en-us-dol';
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note) values('news-de-de-dguv','DGUV',array['de-DE'],array['www.dguv.de'],'https://www.dguv.de/de/sonstiges/rss-feed-so-gehts/index.jsp','https://www.dguv.de/en/about-us/legal-information/index.jsp','Official reader feed; external links excluded; private URL discovery only.');
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"feed-links","url":"https://www.dguv.de/de/index.xml.jsp","evidence_urls":["https://www.dguv.de/de/sonstiges/rss-feed-so-gehts/index.jsp","https://www.dguv.de/en/about-us/legal-information/index.jsp"],"note":"RSS 주소·날짜만 수집. 외부 기관 자료는 제외. / Feed URLs and dates only; external domains excluded."}'::jsonb where id='news-de-de-dguv';
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note) values('news-it-it-inail','INAIL',array['it-IT'],array['www.inail.it'],'https://www.inail.it/portale/it/rss.html','https://www.inail.it/portale/it/rss.html','Official RSS reader service. Discovery is not a commercial republication licence; check each item before publication.');
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"feed-links","url":"https://www.inail.it/portale/it.rss.news.xml","evidence_urls":["https://www.inail.it/portale/it/rss.html"],"note":"RSS 주소·날짜만 수집. 공개 전 직접 작성한 안내와 개별 권리 검수 필요. / Feed URLs/dates only; write a label and verify rights before publishing.","robots_url":"https://www.inail.it/portale/robots.txt","item_prefixes":["/portale/it/inail-comunica/news/"],"date_format":"dmy"}'::jsonb where id='news-it-it-inail';
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note) values('news-ko-moel','고용노동부',array['ko'],array['www.moel.go.kr'],'https://www.moel.go.kr/site/rss/rssList.do','https://www.moel.go.kr/site/copyright/copyrightList.do','Official RSS reader service. KOGL type and third-party exceptions require item review.');
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"feed-links","url":"https://www.moel.go.kr/rss/policy.do","evidence_urls":["https://www.moel.go.kr/site/rss/rssList.do","https://www.moel.go.kr/site/copyright/copyrightList.do"],"note":"정책 자료 주소·날짜만 수집. 안전보건 관련 여부와 공공누리 유형 검수 필요. / Policy links only; verify safety relevance and each KOGL licence."}'::jsonb where id='news-ko-moel';
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note) values('news-en-ca-on-labour','Ontario Labour news',array['en-CA-ON'],array['news.ontario.ca'],'https://news.ontario.ca/mltsd/en','https://www.ontario.ca/page/copyright-information','Official ministry RSS. Private URL discovery only; verify item rights, dates and applicability.');
update resource_private.sources set collection='{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"feed-links","url":"https://news.ontario.ca/mltsd/en/rss/news.rss","evidence_urls":["https://news.ontario.ca/mltsd/en","https://www.ontario.ca/page/copyright-information"],"note":"노동부 RSS 주소·날짜만 수집. 접근 제한 시 자동 중지. / Labour RSS URLs/dates only; stop on access restrictions."}'::jsonb where id='news-en-ca-on-labour';

-- MOM terms section 6 requires permission for deep links. Suspend only our resource-directory source.
update resource_private.sources set active=false,policy_note='Terms section 6 requires prior permission for internal links. Source suspended pending permission; no automatic collection or publication.' where id='official-en-sg';
insert into resource_private.audit(action,target) values('source_permission_suspended','official-en-sg');

insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,collection) values('news-en-ca-esdc','Employment and Social Development Canada',array['en-CA'],array['www.canada.ca','api.io.canada.ca'],'https://www.canada.ca/en/employment-social-development/news.html','https://www.canada.ca/en/transparency/terms.html','Government of Canada official reader feed. Federal scope only; private URL discovery, not a blanket republication licence.','{"checked_at":"2026-10-28","review_until":"2027-01-26T00:00:00Z","enabled":true,"mode":"feed-links","url":"https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofemploymentandsocialdevelopment&sort=publishedDate&orderBy=desc&pick=40&format=atom","evidence_urls":["https://www.canada.ca/en/news/subscribe-emails.html","https://www.canada.ca/en/transparency/terms.html"],"item_prefixes":["/en/employment-social-development/news/"],"note":"연방 소식 주소·날짜만 수집. 주별 법령이 아니며 산업안전 관련 여부를 검수해야 합니다. / Federal news URLs/dates only; not provincial law; verify safety relevance."}'::jsonb);
