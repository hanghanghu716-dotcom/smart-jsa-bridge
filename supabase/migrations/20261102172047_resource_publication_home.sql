-- Source permission is reviewed separately from individual news. No body copying.
alter table resource_private.sources add column automatic_publication jsonb not null default '{}';

create function resource_private.can_publish_feed(i resource_private.items,s resource_private.sources) returns boolean
language sql stable set search_path='' as $$
 select coalesce(s.active and s.commercial and s.review_until>now()
 and s.automatic_publication @> '{"eligible":true,"enabled":true}'::jsonb
 and (s.automatic_publication->>'review_until')::timestamptz>now()
 and s.automatic_publication->>'evidence_url' ~ '^https://[^[:space:]]+$'
 and length(s.automatic_publication->>'attribution')>=12
 and s.collection->>'enabled'='true' and s.collection->>'mode'='feed'
 and (s.collection->>'review_until')::timestamptz>now()
 and i.collection_provenance->>'mode'='feed' and i.locale=any(s.locales)
 and resource_private.valid_url(i.url,s.domains)
 and i.kind='news' and i.summary='' and not i.translated
 and length(btrim(i.title)) between 8 and 250
 and i.title !~ '[<>[:cntrl:]]' and i.title not ilike '%link awaiting review%'
 and i.source_date between current_date-180 and current_date+1,false);
$$;
revoke all on function resource_private.can_publish_feed(resource_private.items,resource_private.sources) from public,anon,authenticated,service_role;

create function resource_private.publish_collected_feed() returns trigger
language plpgsql security definer set search_path='' as $$
declare s resource_private.sources; begin
 -- Collector inserts only; an update/re-import can never undo operator withdrawal.
 select * into s from resource_private.sources where id=new.source_id;
 if new.state='pending' and resource_private.can_publish_feed(new,s) then
  new.state='published';new.published_at=now();
  new.evidence_url=s.automatic_publication->>'evidence_url';
  new.attribution=s.automatic_publication->>'attribution';
  new.review_until=least(s.review_until,(s.automatic_publication->>'review_until')::timestamptz,(s.collection->>'review_until')::timestamptz);
  new.checked_by=null;new.checked_at=null;new.checks='{"automatic":true}';
  new.collection_provenance=new.collection_provenance||'{"automatic_publication":true}'::jsonb;
 end if;
 return new;
end $$;
revoke all on function resource_private.publish_collected_feed() from public,anon,authenticated,service_role;
create trigger automatic_feed_publication before insert on resource_private.items for each row execute function resource_private.publish_collected_feed();

create function resource_private.audit_feed_publication() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into resource_private.audit(action,target) values('automatic_publish',new.id::text);
 return new;
end $$;
revoke all on function resource_private.audit_feed_publication() from public,anon,authenticated,service_role;
create trigger automatic_feed_audit after insert on resource_private.items
for each row when(new.state='published' and new.collection_provenance->>'automatic_publication'='true') execute function resource_private.audit_feed_publication();

create function resource_private.record_manual_review() returns trigger language plpgsql set search_path='' as $$
begin
 if new.checked_by is not null and new.checked_at is distinct from old.checked_at then
  new.collection_provenance=new.collection_provenance-'automatic_publication';
 end if;
 return new;
end $$;
revoke all on function resource_private.record_manual_review() from public,anon,authenticated,service_role;
create trigger record_manual_review before update on resource_private.items for each row execute function resource_private.record_manual_review();

create or replace function resource_private.visible(i resource_private.items,s resource_private.sources) returns boolean
language sql stable set search_path='' as $$
 select s.active and i.state='published' and s.review_until>now() and i.review_until>now()
 and i.locale=any(s.locales) and i.evidence_url<>'' and resource_private.valid_url(i.url,s.domains)
 and (i.summary='' or (s.commercial and s.adaptation and i.reuse_confirmed and length(btrim(i.attribution))>=12))
 and (not i.translated or (s.commercial and s.adaptation and i.reuse_confirmed and length(btrim(i.attribution))>=12))
 and (coalesce(i.collection_provenance->>'automatic_publication','false')<>'true' or resource_private.can_publish_feed(i,s));
$$;

create function public.resource_publication(p_action text,p_id text,p_enabled boolean default false) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' as $$
declare i resource_private.items;s resource_private.sources; begin
 if not jsa_private.community_admin() then raise exception 'ADMIN_MFA_REQUIRED' using errcode='42501';end if;
 if p_action='automatic' then
  select * into s from resource_private.sources where id=p_id;
  if s.id is null then raise exception 'SOURCE_NOT_FOUND';end if;
  if p_enabled and not coalesce(s.automatic_publication->>'eligible'='true' and s.active and s.commercial and s.review_until>now()
   and (s.automatic_publication->>'review_until')::timestamptz>now() and s.collection->>'mode'='feed',false) then raise exception 'SOURCE_PERMISSION_REQUIRED';end if;
  update resource_private.sources set automatic_publication=automatic_publication||jsonb_build_object('enabled',p_enabled) where id=p_id;
 elsif p_action in ('withdraw','restore') then
  select * into i from resource_private.items where id=p_id::uuid;
  if i.id is null then raise exception 'ITEM_NOT_FOUND';end if;
  if p_action='restore' then
   select * into s from resource_private.sources where id=i.source_id;
   i.state='published';
   if i.published_at is null or not coalesce(resource_private.visible(i,s),false) then raise exception 'PUBLICATION_REVIEW_REQUIRED';end if;
  end if;
  update resource_private.items set state=case when p_action='restore' then 'published' else 'withdrawn' end,updated_at=now() where id=i.id;
 else raise exception 'INVALID_ACTION';end if;
 insert into resource_private.audit(actor,action,target) values(auth.uid(),'publication_'||p_action,p_id);
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.resource_publication(text,text,boolean) from public,anon;
grant execute on function public.resource_publication(text,text,boolean) to authenticated;

-- HSE expressly permits Crown information reuse under OGL. Titles/links/dates
-- only, no bodies/images/logos/translation. Other source permissions unchanged.
update resource_private.sources set commercial=true,automatic_publication=jsonb_build_object(
 'eligible',true,'enabled',true,'review_until','2027-01-26T00:00:00Z',
 'evidence_url','https://www.hse.gov.uk/help/copyright.htm',
 'attribution','Source: Health and Safety Executive (HSE). Crown information under the Open Government Licence v3.0. Original title; no affiliation or endorsement.')
where id='official-en-gb';

-- Publish only eligible existing unedited feed discoveries, never withdrawn or manually edited records.
with promoted as (
 update resource_private.items i set state='published',published_at=now(),updated_at=now(),
 evidence_url=s.automatic_publication->>'evidence_url',attribution=s.automatic_publication->>'attribution',
 review_until=least(s.review_until,(s.automatic_publication->>'review_until')::timestamptz,(s.collection->>'review_until')::timestamptz),
 checks='{"automatic":true}',collection_provenance=i.collection_provenance||'{"automatic_publication":true}'::jsonb
 from resource_private.sources s where i.source_id=s.id and i.state='pending' and i.checked_at is null and i.published_at is null
 and resource_private.can_publish_feed(i,s) returning i.id
) insert into resource_private.audit(action,target) select 'automatic_publish',id::text from promoted;

-- One bounded public query for the homepage, no cross-country substitution.
create function public.resource_home(p_locale text) returns jsonb
language plpgsql stable security definer set search_path='' set statement_timeout='5s' as $$
declare news jsonb;jobs jsonb;begin
 news=public.resource_hub(p_locale,'','news','',0,false);
 jobs=public.job_catalog(p_locale,'open','',0);
 return jsonb_build_object('news',coalesce((select jsonb_agg(x) from(select value x from jsonb_array_elements(news->'items') limit 4)t),'[]'),
 'jobs',coalesce((select jsonb_agg(x) from(select value x from jsonb_array_elements(jobs->'items') limit 4)t),'[]'),
 'jobs_connected',exists(select 1 from jsonb_array_elements(jobs->'sources')x where x->>'connected'='true'));
end $$;
revoke all on function public.resource_home(text) from public;
grant execute on function public.resource_home(text) to anon,authenticated;

-- The operator completed USAJOBS registration; the live API and server secrets
-- were verified on 2026-11-03 KST. Other job providers remain disabled.
update resource_private.job_sources set enabled=true,review_until=now()+interval '90 days',
 evidence_url='https://developer.usajobs.gov/apirequest/index',
 review_note='USAJOBS public-data reuse terms verified; operator email registration and live API verified. Federal safety/industrial hygiene jobs, original links and dates only. No applications, logos or full descriptions.'
where id='usajobs';
insert into resource_private.audit(action,target) values('job_source_connection_verified','usajobs');
create function resource_private.dispatch_jobs() returns bigint language sql security definer set search_path='' as $$
 select net.http_post(url:='https://aajvezmhyrdawxxbulqz.supabase.co/functions/v1/collect-government-jobs',
 headers:=jsonb_build_object('Content-Type','application/json','x-resource-token',(select decrypted_secret from vault.decrypted_secrets where name='safety_resource_collector')),
 body:='{}'::jsonb,timeout_milliseconds:=60000);
$$;
revoke all on function resource_private.dispatch_jobs() from public,anon,authenticated,service_role;
select cron.schedule('government-jobs-daily','45 6 * * *','select resource_private.dispatch_jobs();');

create or replace function public.resource_hub(p_locale text,p_query text default '',p_kind text default '',p_topic text default '',p_page integer default 0,p_following boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' set statement_timeout='5s' as $$
declare result jsonb; begin
 if length(p_query)>160 or p_page<0 or p_page>5000 then raise exception 'INVALID_QUERY'; end if;
 with selected as (
 select i.id,i.title,i.url,i.locale,i.kind,i.topic,i.summary,i.attribution,i.search_term,i.source_date,i.event_date,i.effective_date,
 coalesce(i.collection_provenance->>'automatic_publication','false')='true' as automatic,i.translated,i.checked_at,i.published_at,s.name as source,s.policy_url
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
