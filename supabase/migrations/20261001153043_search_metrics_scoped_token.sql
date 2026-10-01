-- Requires search_console_sync. Credentials are provisioned separately, never in migrations.
create table jsa_private.search_ingest_tokens (
 name text primary key,
 token_hash text unique not null check(token_hash ~ '^[0-9a-f]{64}$'),
 property text not null check(property in ('sc-domain:smartjsabridge.com','https://smartjsabridge.com/')),
 providers text[] not null default array['google','bing']::text[]
   check(cardinality(providers)>0 and providers <@ array['google','bing']::text[]),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 last_used_at timestamptz
);
alter table jsa_private.search_ingest_tokens enable row level security;
revoke all on jsa_private.search_ingest_tokens from public,anon,authenticated,service_role;

-- Owner-only core. No client role can call it directly.
create function jsa_private.apply_search_metrics(payload jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare prov text:=payload->>'provider'; prop text:=payload->>'property'; first_day date; last_day date; previous_property text;
begin
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

revoke all on function jsa_private.apply_search_metrics(jsonb) from public,anon,authenticated,service_role;

-- Preserve the existing server-only entry point and its original role check.
create or replace function jsa_private.ingest_search_metrics(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'SERVICE_REQUIRED' using errcode='42501'; end if;
 return jsa_private.apply_search_metrics(payload);
end $$;
revoke all on function jsa_private.ingest_search_metrics(jsonb) from public,anon,authenticated;
grant execute on function jsa_private.ingest_search_metrics(jsonb) to service_role;

-- Machine authentication uses a 256-bit scoped token, not a user session.
-- The raw token is never stored. It grants only aggregate ingestion, no reads.
create function jsa_private.ingest_search_metrics_token(p_token text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare credential jsa_private.search_ingest_tokens%rowtype; result jsonb;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'TOKEN_REQUIRED' using errcode='42501'; end if;
 select * into credential from jsa_private.search_ingest_tokens
 where token_hash=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_token,'UTF8')),'hex')
 and revoked_at is null and expires_at>statement_timestamp() for update;
 if not found then raise exception 'TOKEN_REQUIRED' using errcode='42501'; end if;
 if p_payload is null or pg_column_size(p_payload)>262144 or jsonb_typeof(p_payload)<>'object'
 or (p_payload->>'property') is distinct from credential.property
 or coalesce((p_payload->>'provider')=any(credential.providers),false)=false then
   raise exception 'INVALID_SCOPE' using errcode='42501';
 end if;
 result:=jsa_private.apply_search_metrics(p_payload);
 update jsa_private.search_ingest_tokens set last_used_at=statement_timestamp() where name=credential.name;
 return result;
end $$;
create function public.ingest_search_metrics_token(p_token text,p_payload jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select jsa_private.ingest_search_metrics_token(p_token,p_payload) $$;
revoke all on function jsa_private.ingest_search_metrics_token(text,jsonb),public.ingest_search_metrics_token(text,jsonb) from public,anon,authenticated,service_role;
grant usage on schema jsa_private to anon;
grant execute on function jsa_private.ingest_search_metrics_token(text,jsonb),public.ingest_search_metrics_token(text,jsonb) to anon;
notify pgrst,'reload schema';
