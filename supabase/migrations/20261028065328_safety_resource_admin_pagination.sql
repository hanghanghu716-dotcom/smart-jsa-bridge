alter table resource_private.items add column attribution text not null default '' check(length(attribution)<=1000);

create or replace function public.resource_admin(p_action text,p_id text default '',p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' as $$
declare s resource_private.sources; i resource_private.items; page_number integer:=greatest(0,least(5000,coalesce((p_data->>'page')::integer,0))); begin
 if not jsa_private.community_admin() then raise exception 'ADMIN_MFA_REQUIRED' using errcode='42501';end if;
 if p_action='list' then return jsonb_build_object('sources',(select jsonb_agg(to_jsonb(x) order by name) from resource_private.sources x),
 'items',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from resource_private.items order by updated_at desc,id limit 100 offset page_number*100)x),'[]'),
 'has_more',(select count(*)>100 from (select 1 from resource_private.items order by updated_at desc,id limit 101 offset page_number*100)x),
 'audit',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from resource_private.audit order by id desc limit 30)x),'[]'));end if;
 if p_action='source' then
 if coalesce(length(btrim(p_data->>'policy_note')),0)<12 or coalesce(p_data->>'policy_url','') !~ '^https://[^[:space:]]+$' then raise exception 'SOURCE_EVIDENCE_REQUIRED';end if;
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
 if (coalesce(p_data->>'summary','')<>'' or coalesce((p_data->>'translated')::boolean,false)) and coalesce(length(btrim(p_data->>'attribution')),0)<12 then raise exception 'ATTRIBUTION_REQUIRED';end if;
 end if;
 insert into resource_private.items(id,source_id,url,title,locale,kind,topic,summary,attribution,search_term,source_date,event_date,effective_date,translated,state,reuse_confirmed,evidence_url,review_until,checks,checked_by,checked_at,published_at)
 values(coalesce(i.id,gen_random_uuid()),s.id,p_data->>'url',btrim(p_data->>'title'),p_data->>'locale',p_data->>'kind',p_data->>'topic',coalesce(p_data->>'summary',''),coalesce(p_data->>'attribution',''),coalesce(p_data->>'search_term',''),nullif(p_data->>'source_date','')::date,nullif(p_data->>'event_date','')::date,nullif(p_data->>'effective_date','')::date,coalesce((p_data->>'translated')::boolean,false),case when p_action='publish' then 'published' else 'pending' end,coalesce((p_data->>'reuse_confirmed')::boolean,false),coalesce(p_data->>'evidence_url',''),case when p_action='publish' then now()+interval '90 days' end,coalesce(p_data->'checks','{}'),auth.uid(),now(),case when p_action='publish' then coalesce(i.published_at,now()) end)
 on conflict(id) do update set source_id=excluded.source_id,url=excluded.url,title=excluded.title,locale=excluded.locale,kind=excluded.kind,topic=excluded.topic,summary=excluded.summary,attribution=excluded.attribution,search_term=excluded.search_term,source_date=excluded.source_date,event_date=excluded.event_date,effective_date=excluded.effective_date,translated=excluded.translated,state=excluded.state,reuse_confirmed=excluded.reuse_confirmed,evidence_url=excluded.evidence_url,review_until=excluded.review_until,checks=excluded.checks,checked_by=excluded.checked_by,checked_at=excluded.checked_at,published_at=excluded.published_at,updated_at=now() returning * into i;
 p_id=i.id::text;
 elsif p_action='withdraw' then update resource_private.items set state='withdrawn',updated_at=now() where id=p_id::uuid;
 else raise exception 'INVALID_ACTION';end if;
 insert into resource_private.audit(actor,action,target) values(auth.uid(),p_action,p_id);
 return jsonb_build_object('ok',true,'id',p_id);
end $$;

create or replace function public.resource_hub(p_locale text,p_query text default '',p_kind text default '',p_topic text default '',p_page integer default 0,p_following boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' set statement_timeout='5s' as $$
declare result jsonb; begin
 if length(p_query)>160 or p_page<0 or p_page>5000 then raise exception 'INVALID_QUERY'; end if;
 with selected as (
 select i.id,i.title,i.url,i.locale,i.kind,i.topic,i.summary,i.attribution,i.search_term,i.source_date,i.event_date,i.effective_date,
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

create or replace function resource_private.visible(i resource_private.items,s resource_private.sources) returns boolean
language sql stable set search_path='' as $$
 select s.active and i.state='published' and s.review_until>now() and i.review_until>now()
 and i.evidence_url<>'' and resource_private.valid_url(i.url,s.domains)
 and (i.summary='' or (s.commercial and s.adaptation and i.reuse_confirmed and length(btrim(i.attribution))>=12))
 and (not i.translated or (s.adaptation and i.reuse_confirmed and length(btrim(i.attribution))>=12));
$$;
