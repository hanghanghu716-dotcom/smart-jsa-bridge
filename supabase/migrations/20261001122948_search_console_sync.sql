-- Aggregate search performance only. No search queries, identifiers or API secrets.
create table jsa_private.search_daily (
 provider text not null check(provider in ('google','bing')),
 scope text not null check(scope in ('site','discovery')),
 day date not null,
 clicks bigint not null check(clicks between 0 and 1000000000000),
 impressions bigint not null check(impressions between 0 and 1000000000000),
 primary key(provider,scope,day),
 check(provider='google' or scope='site')
);
create table jsa_private.search_sync_state (
 provider text primary key check(provider in ('google','bing')),
 property text not null,
 status text not null check(status in ('success','error')),
 error_code text,
 attempted_at timestamptz not null default now(),
 succeeded_at timestamptz,
 range_start date,
 range_end date
);
create table jsa_private.search_manual_months (
 month date primary key check(month=date_trunc('month',month)::date),
 clicks bigint not null check(clicks between 0 and 1000000000000),
 impressions bigint check(impressions between 0 and 1000000000000),
 source text not null check(length(source) between 5 and 500),
 updated_at timestamptz not null default now()
);
alter table jsa_private.search_daily enable row level security;
alter table jsa_private.search_sync_state enable row level security;
alter table jsa_private.search_manual_months enable row level security;
revoke all on jsa_private.search_daily,jsa_private.search_sync_state,jsa_private.search_manual_months from public,anon,authenticated;

-- This private definer is needed to write private tables through an invoker RPC.
-- Only service_role can execute it; never granted to authenticated users/admin UI.
create function jsa_private.ingest_search_metrics(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare prov text:=payload->>'provider'; prop text:=payload->>'property'; first_day date; last_day date; previous_property text;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'SERVICE_REQUIRED' using errcode='42501'; end if;
 if prov is null or prov not in ('google','bing') or prop is null or
    (prov='google' and prop not in ('sc-domain:smartjsabridge.com','https://smartjsabridge.com/')) or
    (prov='bing' and prop<>'https://smartjsabridge.com/') then raise exception 'INVALID_PROVIDER'; end if;
 perform pg_advisory_xact_lock(hashtextextended('search-sync-'||prov,0));
 select property into previous_property from jsa_private.search_sync_state where provider=prov;
 if previous_property is not null and previous_property<>prop then raise exception 'PROPERTY_CHANGED'; end if;
 if payload->>'status'='error' then
  if payload->>'code' is null or payload->>'code' not in ('AUTH_ERROR','RATE_LIMIT','PROVIDER_ERROR','NETWORK_ERROR','INVALID_RESPONSE','CONFIG_ERROR') then raise exception 'INVALID_ERROR'; end if;
  insert into jsa_private.search_sync_state(provider,property,status,error_code) values(prov,prop,'error',payload->>'code')
  on conflict(provider) do update set status='error',error_code=excluded.error_code,attempted_at=now();
  return jsonb_build_object('ok',true);
 end if;
 if payload->>'status' is distinct from 'success' or jsonb_typeof(payload->'rows') is distinct from 'array' then raise exception 'INVALID_BATCH'; end if;
 first_day:=(payload->>'start')::date; last_day:=(payload->>'end')::date;
 if first_day is null or last_day is null or first_day>last_day or last_day-first_day>370 or last_day>current_date or first_day<current_date-500 or jsonb_array_length(payload->'rows')>1000 then raise exception 'INVALID_RANGE'; end if;
 if exists(select 1 from jsonb_array_elements(payload->'rows') r
  where r->>'day' is null or (r->>'day')::date not between first_day and last_day
  or r->>'scope' is null or r->>'scope' not in ('site','discovery') or (prov='bing' and r->>'scope'<>'site')
  or coalesce(r->>'clicks','') !~ '^[0-9]+$' or coalesce(r->>'impressions','') !~ '^[0-9]+$') then raise exception 'INVALID_ROW'; end if;
 if exists(select 1 from jsonb_array_elements(payload->'rows') r group by r->>'scope',r->>'day' having count(*)>1) then raise exception 'DUPLICATE_DAY'; end if;
 -- Google returns a full requested interval for both scopes. Bing returns its
 -- available history: absent Bing rows must never erase previously stored data.
 if prov='google' then delete from jsa_private.search_daily where provider=prov and day between first_day and last_day; end if;
 insert into jsa_private.search_daily(provider,scope,day,clicks,impressions)
 select prov,r->>'scope',(r->>'day')::date,(r->>'clicks')::bigint,(r->>'impressions')::bigint from jsonb_array_elements(payload->'rows') r
 on conflict(provider,scope,day) do update set clicks=excluded.clicks,impressions=excluded.impressions;
 insert into jsa_private.search_sync_state(provider,property,status,succeeded_at,range_start,range_end)
 values(prov,prop,'success',now(),first_day,last_day)
 on conflict(provider) do update set status='success',error_code=null,attempted_at=now(),succeeded_at=now(),range_start=first_day,range_end=last_day;
 return jsonb_build_object('ok',true,'rows',jsonb_array_length(payload->'rows'));
end $$;
create function public.ingest_search_metrics(p_payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select jsa_private.ingest_search_metrics(p_payload) $$;
revoke all on function jsa_private.ingest_search_metrics(jsonb),public.ingest_search_metrics(jsonb) from public,anon,authenticated;
grant usage on schema jsa_private to service_role;
grant execute on function jsa_private.ingest_search_metrics(jsonb),public.ingest_search_metrics(jsonb) to service_role;

create function jsa_private.search_metrics_admin(action text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare month_key date; result jsonb;
begin
 if auth.uid() is null or not jsa_private.community_admin() then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 if action='naver_month' then
  month_key:=(payload->>'month')::date;
  if month_key is null or month_key<>date_trunc('month',month_key)::date or month_key<date_trunc('month',current_date)-interval '11 months' or month_key>=date_trunc('month',current_date)
   or coalesce(payload->>'clicks','') !~ '^[0-9]+$' or (payload->>'impressions' is not null and payload->>'impressions' !~ '^[0-9]+$')
   or length(trim(coalesce(payload->>'source','')))<5 or length(payload->>'source')>500 then raise exception 'INVALID_MONTH'; end if;
  insert into jsa_private.search_manual_months(month,clicks,impressions,source) values(month_key,(payload->>'clicks')::bigint,(payload->>'impressions')::bigint,trim(payload->>'source'))
  on conflict(month) do update set clicks=excluded.clicks,impressions=excluded.impressions,source=excluded.source,updated_at=now();
  insert into jsa_private.discovery_audit(actor,action,payload) values(auth.uid(),'naver_month',payload);
  return jsonb_build_object('ok',true);
 elsif action<>'dashboard' or action is null then raise exception 'INVALID_ACTION'; end if;
 with monthly as (
  select provider,scope,date_trunc('month',day)::date as month,sum(clicks) clicks,sum(impressions) impressions,min(day) first_day,max(day) last_day,count(*) observed_days
  from jsa_private.search_daily where day>=date_trunc('month',current_date)-interval '11 months' group by 1,2,3
 ) select jsonb_build_object(
  'monthly',coalesce((select jsonb_agg(to_jsonb(m) order by month desc,provider,scope) from monthly m),'[]'),
  'connections',coalesce((select jsonb_agg(to_jsonb(s) order by provider) from jsa_private.search_sync_state s),'[]'),
  'naver',coalesce((select jsonb_agg(to_jsonb(n) order by month desc) from jsa_private.search_manual_months n where month>=date_trunc('month',current_date)-interval '11 months'),'[]'),
  'legacy',coalesce((select jsonb_agg(to_jsonb(l) order by month desc) from jsa_private.search_months l where month>=date_trunc('month',current_date)-interval '11 months'),'[]')
 ) into result;
 return result;
end $$;
create function public.search_metrics_admin(p_action text default 'dashboard',p_payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select jsa_private.search_metrics_admin(p_action,p_payload) $$;
revoke all on function jsa_private.search_metrics_admin(text,jsonb),public.search_metrics_admin(text,jsonb) from public,anon,authenticated;
grant execute on function jsa_private.search_metrics_admin(text,jsonb),public.search_metrics_admin(text,jsonb) to authenticated;
notify pgrst,'reload schema';
