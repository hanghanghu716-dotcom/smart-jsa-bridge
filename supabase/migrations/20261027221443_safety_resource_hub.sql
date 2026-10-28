create schema if not exists resource_private;
revoke all on schema resource_private from public, anon, authenticated;
create table resource_private.sources (
 id text primary key, name text not null, locales text[] not null, domains text[] not null,
 home_url text not null, policy_url text not null default '', policy_note text not null default '',
 feed_url text, active boolean not null default true, commercial boolean not null default false,
 adaptation boolean not null default false, checked_at timestamptz not null default now(),
 review_until timestamptz not null default now()+interval '90 days', last_collected_at timestamptz, collection_status text
);
create table resource_private.items (
 id uuid primary key default gen_random_uuid(), source_id text not null references resource_private.sources(id),
 url text not null unique check(length(url)<=2000), title text not null check(length(title) between 1 and 250),
 locale text not null, kind text not null default 'news' check(kind in ('news','incident','legal','form')),
 topic text not null default 'general' check(topic in ('common','construction','manufacturing','chemical','high-risk','general')),
 summary text not null default '' check(length(summary)<=1600), search_term text not null default '' check(length(search_term)<=100),
 source_date date, event_date date, effective_date date, translated boolean not null default false,
 state text not null default 'pending' check(state in ('pending','published','withdrawn')),
 reuse_confirmed boolean not null default false, evidence_url text not null default '', review_until timestamptz,
 checks jsonb not null default '{}', checked_by uuid, checked_at timestamptz, created_at timestamptz not null default now(),
 published_at timestamptz, updated_at timestamptz not null default now()
);
create index resource_items_browse on resource_private.items(locale,state,published_at desc,id);
create index resource_items_source on resource_private.items(source_id);
create table resource_private.follows (
 user_id uuid not null references auth.users(id) on delete cascade, locale text not null, topic text not null,
 created_at timestamptz not null default now(), primary key(user_id,locale,topic)
);
create table resource_private.audit (
 id bigint generated always as identity primary key, actor uuid, action text not null,
 target text, created_at timestamptz not null default now()
);
alter table resource_private.sources enable row level security;
alter table resource_private.items enable row level security;
alter table resource_private.follows enable row level security;
alter table resource_private.audit enable row level security;
revoke all on all tables in schema resource_private from public,anon,authenticated;

create function resource_private.valid_url(p_url text,p_domains text[]) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(p_url ~ '^https://[a-zA-Z0-9.-]+(/[^[:cntrl:] ]*)?$' and
 substring(p_url from '^https://([^/]+)')=any(p_domains) and position(chr(92) in p_url)=0,false);
$$;
create function resource_private.visible(i resource_private.items,s resource_private.sources) returns boolean
language sql stable set search_path='' as $$
 select s.active and i.state='published' and s.review_until>now() and i.review_until>now()
 and i.evidence_url<>'' and resource_private.valid_url(i.url,s.domains)
 and (i.summary='' or (s.commercial and s.adaptation and i.reuse_confirmed))
 and (not i.translated or (s.adaptation and i.reuse_confirmed));
$$;
create function public.resource_hub(p_locale text,p_query text default '',p_kind text default '',p_topic text default '',p_page integer default 0,p_following boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' set statement_timeout='5s' as $$
declare result jsonb; begin
 if length(p_query)>160 or p_page<0 or p_page>5000 then raise exception 'INVALID_QUERY'; end if;
 with selected as (
 select i.id,i.title,i.url,i.locale,i.kind,i.topic,i.summary,i.search_term,i.source_date,i.event_date,i.effective_date,
 i.translated,i.checked_at,i.published_at,s.name as source,s.policy_url
 from resource_private.items i join resource_private.sources s on s.id=i.source_id
 where i.locale=p_locale and p_locale=any(s.locales) and resource_private.visible(i,s)
 and (p_kind='' or i.kind=p_kind) and (p_topic='' or i.topic=p_topic)
 and (p_query='' or position(lower(p_query) in lower(i.title||' '||i.summary))>0)
 and (not p_following or exists(select 1 from resource_private.follows f where f.user_id=auth.uid() and f.locale=p_locale and f.topic=i.topic))
 order by i.published_at desc,i.id limit 13 offset p_page*12
 ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from selected limit 12)x),'[]'),
 'has_more',(select count(*)>12 from selected),
 'sources',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'url',s.home_url,'policy_url',s.policy_url,'checked_at',s.checked_at) order by s.name)
 from resource_private.sources s where s.active and s.review_until>now() and p_locale=any(s.locales)),'[]')) into result;
 return result;
end $$;
revoke all on function public.resource_hub(text,text,text,text,integer,boolean) from public;
grant execute on function public.resource_hub(text,text,text,text,integer,boolean) to anon,authenticated;

create function public.resource_follows(p_action text default 'list',p_locale text default '',p_topic text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if p_action in ('follow','unfollow') then
 if not exists(select 1 from resource_private.sources where p_locale=any(locales)) or p_topic not in ('common','construction','manufacturing','chemical','high-risk','general') then raise exception 'INVALID_TOPIC';end if;
 if p_action='follow' then insert into resource_private.follows(user_id,locale,topic) values(auth.uid(),p_locale,p_topic) on conflict do nothing;
 else delete from resource_private.follows where user_id=auth.uid() and locale=p_locale and topic=p_topic;end if;
 elsif p_action<>'list' then raise exception 'INVALID_ACTION';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('locale',locale,'topic',topic)) from resource_private.follows where user_id=auth.uid()),'[]');
end $$;
revoke all on function public.resource_follows(text,text,text) from public,anon;
grant execute on function public.resource_follows(text,text,text) to authenticated;

create function public.resource_admin(p_action text,p_id text default '',p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' as $$
declare s resource_private.sources; i resource_private.items; expiry timestamptz; begin
 if not jsa_private.community_admin() then raise exception 'ADMIN_MFA_REQUIRED' using errcode='42501';end if;
 if p_action='list' then return jsonb_build_object('sources',(select jsonb_agg(to_jsonb(x) order by name) from resource_private.sources x),
 'items',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from resource_private.items order by updated_at desc limit 200)x),'[]'),
 'audit',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from resource_private.audit order by id desc limit 30)x),'[]'));end if;
 if p_action='source' then
 if length(p_data->>'policy_note')<12 or (p_data->>'policy_url') !~ '^https://[^[:space:]]+$' then raise exception 'SOURCE_EVIDENCE_REQUIRED';end if;
 update resource_private.sources set active=coalesce((p_data->>'active')::boolean,false),
 commercial=coalesce((p_data->>'commercial')::boolean,false),adaptation=coalesce((p_data->>'adaptation')::boolean,false),
 policy_url=p_data->>'policy_url',policy_note=p_data->>'policy_note',checked_at=now(),review_until=now()+interval '90 days' where id=p_id returning * into s;
 if s.id is null then raise exception 'SOURCE_NOT_FOUND';end if;
 elsif p_action in ('save','publish') then
 select * into s from resource_private.sources where id=p_data->>'source_id';
 if s.id is null or not resource_private.valid_url(p_data->>'url',s.domains) or not (p_data->>'locale'=any(s.locales)) then raise exception 'SOURCE_SCOPE_INVALID';end if;
 if p_id<>'' then select * into i from resource_private.items where id=p_id::uuid; if i.id is null then raise exception 'ITEM_NOT_FOUND';end if;end if;
 if p_action='publish' then
 if not s.active or s.review_until<=now() or not coalesce(p_data->'checks' @> '{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,false)
 or (p_data->>'evidence_url') !~ '^https://[^[:space:]]+$' or coalesce(length(p_data->>'evidence_url'),0)=0 then raise exception 'PUBLICATION_REVIEW_REQUIRED';end if;
 if (coalesce(p_data->>'summary','')<>'' or coalesce((p_data->>'translated')::boolean,false)) and not (s.commercial and s.adaptation and coalesce((p_data->>'reuse_confirmed')::boolean,false)) then raise exception 'REUSE_PERMISSION_REQUIRED';end if;
 end if;
 insert into resource_private.items(id,source_id,url,title,locale,kind,topic,summary,search_term,source_date,event_date,effective_date,translated,state,reuse_confirmed,evidence_url,review_until,checks,checked_by,checked_at,published_at)
 values(coalesce(i.id,gen_random_uuid()),s.id,p_data->>'url',btrim(p_data->>'title'),p_data->>'locale',p_data->>'kind',p_data->>'topic',coalesce(p_data->>'summary',''),coalesce(p_data->>'search_term',''),nullif(p_data->>'source_date','')::date,nullif(p_data->>'event_date','')::date,nullif(p_data->>'effective_date','')::date,coalesce((p_data->>'translated')::boolean,false),case when p_action='publish' then 'published' else 'pending' end,coalesce((p_data->>'reuse_confirmed')::boolean,false),coalesce(p_data->>'evidence_url',''),case when p_action='publish' then now()+interval '90 days' end,coalesce(p_data->'checks','{}'),auth.uid(),now(),case when p_action='publish' then coalesce(i.published_at,now()) end)
 on conflict(id) do update set source_id=excluded.source_id,url=excluded.url,title=excluded.title,locale=excluded.locale,kind=excluded.kind,topic=excluded.topic,summary=excluded.summary,search_term=excluded.search_term,source_date=excluded.source_date,event_date=excluded.event_date,effective_date=excluded.effective_date,translated=excluded.translated,state=excluded.state,reuse_confirmed=excluded.reuse_confirmed,evidence_url=excluded.evidence_url,review_until=excluded.review_until,checks=excluded.checks,checked_by=excluded.checked_by,checked_at=excluded.checked_at,published_at=excluded.published_at,updated_at=now() returning * into i;
 p_id=i.id::text;
 elsif p_action='withdraw' then update resource_private.items set state='withdrawn',updated_at=now() where id=p_id::uuid;
 else raise exception 'INVALID_ACTION';end if;
 insert into resource_private.audit(actor,action,target) values(auth.uid(),p_action,p_id);
 return jsonb_build_object('ok',true,'id',p_id);
end $$;
revoke all on function public.resource_admin(text,text,jsonb) from public,anon;
grant execute on function public.resource_admin(text,text,jsonb) to authenticated;
revoke all on all functions in schema resource_private from public,anon,authenticated;

-- Country-specific official navigation; no external document bodies or attachments.
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-en-gb','HSE',array['en-GB'],array['www.hse.gov.uk','press.hse.gov.uk'],'https://www.hse.gov.uk/simple-health-safety/risk/steps-needed-to-manage-risk.htm','https://www.hse.gov.uk/help/copyright.htm','OGL source policy; verify item and third-party exclusions before adapted text. Great Britain; not Northern Ireland law.','https://press.hse.gov.uk/feed/');
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-en-au','Safe Work Australia',array['en-AU'],array['www.safeworkaustralia.gov.au'],'https://www.safeworkaustralia.gov.au/doc/safe-work-method-statement-high-risk-construction-work-information-sheet','https://www.safeworkaustralia.gov.au/copyright','CC BY 4.0 except logos, third-party material and marked exceptions. Model guidance; state/territory applicability requires review.','https://www.safeworkaustralia.gov.au/rss.xml');
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-en-sg','MOM',array['en-SG'],array['www.mom.gov.sg'],'https://www.mom.gov.sg/workplace-safety-and-health/safety-and-health-management-systems/risk-management','https://www.mom.gov.sg/terms-of-use','No blanket commercial adaptation permission recorded. Link-only.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-en-ca','CCOHS',array['en-CA'],array['www.ccohs.ca'],'https://www.ccohs.ca/oshanswers/hsprograms/hazard/risk_assessment.html','https://www.ccohs.ca/copyright/copyright.html','Permission required for reprints and excerpts. Link-only.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-en-ca-ab','Alberta OHS',array['en-CA-AB'],array['ohs-pubstore.labour.alberta.ca'],'https://ohs-pubstore.labour.alberta.ca/el003','','Reuse permission not verified. Official outbound navigation only; no copied text, translation, images or attachments.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-en-ca-on','Ontario',array['en-CA-ON'],array['www.ontario.ca'],'https://www.ontario.ca/document/guide-occupational-health-and-safety-act','','Reuse permission not verified. Official outbound navigation only; no copied text, translation, images or attachments.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-en-ca-bc','WorkSafeBC',array['en-CA-BC'],array['www.worksafebc.com'],'https://www.worksafebc.com/en/health-safety/create-manage/managing-risk/assessing-risks','','Reuse permission not verified. Official outbound navigation only; no copied text, translation, images or attachments.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-fr-ca-qc','CNESST',array['fr-CA-QC'],array['www.cnesst.gouv.qc.ca'],'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/organiser-prevention/sante-securite-travail-pour-tous/demarche-prevention/identifier-risques-milieu-travail','','Reuse permission not verified. Official outbound navigation only; no copied text, translation, images or attachments.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-de-de','ArbSchG',array['de-DE'],array['www.gesetze-im-internet.de'],'https://www.gesetze-im-internet.de/arbschg/__5.html','','Reuse permission not verified. Official outbound navigation only; no copied text, translation, images or attachments.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-fr-fr','INRS',array['fr-FR'],array['www.inrs.fr'],'https://www.inrs.fr/demarche/document-unique/ce-qu-il-faut-retenir.html','https://www.inrs.fr/footer/mentions-legales.html','Public reproduction/adaptation prohibited without permission. Links permitted; no logos or embedding.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-it-it','Normattiva',array['it-IT'],array['www.normattiva.it'],'https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3Adecreto.legislativo%3A2008-04-9%3B81~art28%21vig=','','Reuse permission not verified. Official outbound navigation only; no copied text, translation, images or attachments.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-es-es','INSST',array['es-ES'],array['www.insst.es'],'https://www.insst.es/noticias-insst/directrices-basicas-para-la-evaluacion-de-riesgos-laborales','https://www.insst.es/informacion-general/aviso-legal','Reuse conditions and excluded works must be checked per item. No automatic reuse grant.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-ja-jp','厚生労働省',array['ja-JP'],array['www.mhlw.go.jp'],'https://www.mhlw.go.jp/bunya/roudoukijun/anzeneisei14/','https://www.mhlw.go.jp/chosakuken/','PDL 1.0 with source-specific and third-party exceptions. Item permission still required.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-ko','국가법령정보센터',array['ko'],array['law.go.kr'],'https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1024071891','','Reuse permission not verified. Official outbound navigation only; no copied text, translation, images or attachments.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-pt-br','Ministério do Trabalho e Emprego',array['pt-BR'],array['www.gov.br'],'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr/principal','https://www.gov.br/trabalho-e-emprego/pt-br','Portal footer uses BY-ND; do not translate or adapt without separate permission.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-ru-ru','Минтруд',array['ru-RU'],array['mintrud.gov.ru'],'https://mintrud.gov.ru/docs/mintrud/orders/2220','','Reuse permission not verified. Official outbound navigation only; no copied text, translation, images or attachments.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-ar-sa','وزارة الموارد البشرية',array['ar-SA'],array['www.hrsd.gov.sa'],'https://www.hrsd.gov.sa/knowledge-centre/articles/64379','https://www.hrsd.gov.sa/how-use','Personal noncommercial use only; modification and commercial reuse require written permission. Link-only.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-ro-ro','Portal Legislativ',array['ro-RO'],array['legislatie.just.ro'],'https://legislatie.just.ro/public/detaliidocument/73772','','Reuse permission not verified. Official outbound navigation only; no copied text, translation, images or attachments.',null);
insert into resource_private.sources(id,name,locales,domains,home_url,policy_url,policy_note,feed_url) values('official-en-us','OSHA',array['en-US'],array['www.osha.gov'],'https://www.osha.gov/publications','https://www.dol.gov/general/aboutdol/copyright','Federal works: US public-domain status is not a worldwide reuse grant; third-party exclusions. Link-only.',null);

insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-en-gb','https://www.hse.gov.uk/simple-health-safety/risk/steps-needed-to-manage-risk.htm','HSE · Forms & resources','en-GB','form','general','published','https://www.hse.gov.uk/help/copyright.htm',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-en-au','https://www.safeworkaustralia.gov.au/doc/safe-work-method-statement-high-risk-construction-work-information-sheet','Safe Work Australia · Forms & resources','en-AU','form','general','published','https://www.safeworkaustralia.gov.au/copyright',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-en-sg','https://www.mom.gov.sg/workplace-safety-and-health/safety-and-health-management-systems/risk-management','MOM · Forms & resources','en-SG','form','general','published','https://www.mom.gov.sg/terms-of-use',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-en-ca','https://www.ccohs.ca/oshanswers/hsprograms/hazard/risk_assessment.html','CCOHS · Forms & resources','en-CA','form','general','published','https://www.ccohs.ca/copyright/copyright.html',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-en-ca-ab','https://ohs-pubstore.labour.alberta.ca/el003','Alberta OHS · Forms & resources','en-CA-AB','form','general','published','https://ohs-pubstore.labour.alberta.ca/el003',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-en-ca-on','https://www.ontario.ca/document/guide-occupational-health-and-safety-act','Ontario · Forms & resources','en-CA-ON','form','general','published','https://www.ontario.ca/document/guide-occupational-health-and-safety-act',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-en-ca-bc','https://www.worksafebc.com/en/health-safety/create-manage/managing-risk/assessing-risks','WorkSafeBC · Forms & resources','en-CA-BC','form','general','published','https://www.worksafebc.com/en/health-safety/create-manage/managing-risk/assessing-risks',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-fr-ca-qc','https://www.cnesst.gouv.qc.ca/fr/prevention-securite/organiser-prevention/sante-securite-travail-pour-tous/demarche-prevention/identifier-risques-milieu-travail','CNESST · Formulaires et ressources','fr-CA-QC','form','general','published','https://www.cnesst.gouv.qc.ca/fr/prevention-securite/organiser-prevention/sante-securite-travail-pour-tous/demarche-prevention/identifier-risques-milieu-travail',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-de-de','https://www.gesetze-im-internet.de/arbschg/__5.html','ArbSchG · Formulare und Materialien','de-DE','form','general','published','https://www.gesetze-im-internet.de/arbschg/__5.html',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-fr-fr','https://www.inrs.fr/demarche/document-unique/ce-qu-il-faut-retenir.html','INRS · Formulaires et ressources','fr-FR','form','general','published','https://www.inrs.fr/footer/mentions-legales.html',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-it-it','https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3Adecreto.legislativo%3A2008-04-9%3B81~art28%21vig=','Normattiva · Moduli e risorse','it-IT','form','general','published','https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3Adecreto.legislativo%3A2008-04-9%3B81~art28%21vig=',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-es-es','https://www.insst.es/noticias-insst/directrices-basicas-para-la-evaluacion-de-riesgos-laborales','INSST · Formularios y recursos','es-ES','form','general','published','https://www.insst.es/informacion-general/aviso-legal',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-ja-jp','https://www.mhlw.go.jp/bunya/roudoukijun/anzeneisei14/','厚生労働省 · 様式・参考資料','ja-JP','form','general','published','https://www.mhlw.go.jp/chosakuken/',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-ko','https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1024071891','국가법령정보센터 · 양식·참고 자료','ko','form','general','published','https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1024071891',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-pt-br','https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr/principal','Ministério do Trabalho e Emprego · Formulários e recursos','pt-BR','form','general','published','https://www.gov.br/trabalho-e-emprego/pt-br',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-ru-ru','https://mintrud.gov.ru/docs/mintrud/orders/2220','Минтруд · Формы и материалы','ru-RU','form','general','published','https://mintrud.gov.ru/docs/mintrud/orders/2220',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-ar-sa','https://www.hrsd.gov.sa/knowledge-centre/articles/64379','وزارة الموارد البشرية · النماذج والموارد','ar-SA','form','general','published','https://www.hrsd.gov.sa/how-use',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-ro-ro','https://legislatie.just.ro/public/detaliidocument/73772','Portal Legislativ · Formulare și resurse','ro-RO','form','general','published','https://legislatie.just.ro/public/detaliidocument/73772',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
insert into resource_private.items(source_id,url,title,locale,kind,topic,state,evidence_url,review_until,checks,checked_at,published_at) values('official-en-us','https://www.osha.gov/publications','OSHA · Forms & resources','en-US','form','general','published','https://www.dol.gov/general/aboutdol/copyright',now()+interval '90 days','{"rights":true,"accuracy":true,"privacy":true,"scope":true}'::jsonb,now(),now());
