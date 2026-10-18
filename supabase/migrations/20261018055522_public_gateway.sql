-- This key can only submit bounded public metrics/support requests. It cannot
-- read private documents, impersonate users, or modify published content.
create table jsa_private.public_gateway_keys(key_hash bytea primary key, enabled boolean not null default true);
create table jsa_private.gateway_rate(actor uuid not null,day date not null,kind text not null,hits integer not null,primary key(actor,day,kind));
create table jsa_private.external_requests(
 id uuid primary key default gen_random_uuid(),receipt_hash bytea not null,
 category text not null check(category in ('general','suggestion','privacy','copyright','safety','spam','appeal','access','erasure','correction')),
 detail text not null check(length(detail) between 10 and 4000),evidence text not null default '' check(length(evidence)<=1000),
 status text not null default 'open' check(status in ('open','reviewing','resolved','declined')),
 response text not null default '' check(length(response)<=2000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index external_requests_queue on jsa_private.external_requests(status,created_at,id);
create table jsa_private.external_request_audit(id bigint generated always as identity primary key,request_id uuid not null references jsa_private.external_requests(id),actor uuid not null,action text not null,response text not null,created_at timestamptz not null default now());
create index external_request_audit_request on jsa_private.external_request_audit(request_id,created_at);
alter table jsa_private.external_request_audit enable row level security;
revoke all on jsa_private.external_request_audit from public,anon,authenticated;
alter table jsa_private.public_gateway_keys enable row level security;
alter table jsa_private.gateway_rate enable row level security;
alter table jsa_private.external_requests enable row level security;
revoke all on jsa_private.public_gateway_keys,jsa_private.gateway_rate,jsa_private.external_requests from public,anon,authenticated;

create function jsa_private.public_gateway(p_key text,p_actor uuid,p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare today date:=(now() at time zone 'UTC')::date;rate_kind text;ceiling integer;total integer;result jsonb;request_id uuid;
begin
 if p_key is null or length(p_key)<40 or not exists(select 1 from jsa_private.public_gateway_keys where enabled and key_hash=sha256(convert_to(p_key,'UTF8'))) then raise exception 'ACCESS_DENIED';end if;
 if p_actor is null or p_action is null or p_action not in ('case_view','jsa_view','support_create','support_status') or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>20000 then raise exception 'INVALID_REQUEST';end if;
 rate_kind:=case when p_action like 'support_%' then p_action else 'view' end;
 ceiling:=case when rate_kind='support_create' then 5 when rate_kind='support_status' then 100 else 500 end;
 perform pg_advisory_xact_lock(hashtextextended('gateway:'||rate_kind,618));
 delete from jsa_private.gateway_rate where day<today-2;
 select coalesce(sum(hits),0) into total from jsa_private.gateway_rate where day=today and kind=rate_kind;
 if total>=(case when rate_kind='support_create' then 500 else 100000 end) then return jsonb_build_object('error','RATE_LIMIT');end if;
 insert into jsa_private.gateway_rate values(p_actor,today,rate_kind,1) on conflict(actor,day,kind) do update set hits=jsa_private.gateway_rate.hits+1 where jsa_private.gateway_rate.hits<ceiling returning hits into total;
 if not found then return jsonb_build_object('error','RATE_LIMIT');end if;
 -- Force anonymous metrics to use only the trusted gateway's daily network key.
 perform set_config('request.jwt.claim.sub','',true);
 perform set_config('request.jwt.claims','{}',true);
 if p_action='case_view' then return to_jsonb(jsa_metrics_private.record_case_view((p_payload->>'id')::uuid,p_actor));end if;
 if p_action='jsa_view' then return jsa_metrics_private.record_engagement((p_payload->>'id')::uuid,'view',p_actor,'{}'::integer[]);end if;
 if p_action='support_create' then
  if coalesce(p_payload->>'receipt','') !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_RECEIPT';end if;
  insert into jsa_private.external_requests(receipt_hash,category,detail,evidence) values(sha256(convert_to(p_payload->>'receipt','UTF8')),p_payload->>'category',trim(p_payload->>'detail'),coalesce(p_payload->>'evidence','')) returning id into request_id;
  return jsonb_build_object('id',request_id);
 end if;
 select jsonb_build_object('status',status,'response',response,'created_at',created_at,'updated_at',updated_at) into result from jsa_private.external_requests
 where id=(p_payload->>'id')::uuid and receipt_hash=sha256(convert_to(coalesce(p_payload->>'receipt',''),'UTF8'));
 return coalesce(result,jsonb_build_object('error','NOT_FOUND'));
end $$;
create function public.public_gateway(p_key text,p_actor uuid,p_action text,p_payload jsonb) returns jsonb language sql set search_path='' as $$select jsa_private.public_gateway(p_key,p_actor,p_action,p_payload)$$;
revoke all on function jsa_private.public_gateway(text,uuid,text,jsonb),public.public_gateway(text,uuid,text,jsonb) from public;
grant execute on function jsa_private.public_gateway(text,uuid,text,jsonb),public.public_gateway(text,uuid,text,jsonb) to anon;

-- Logged-in reuse retains account-based deduplication. Anonymous client UUIDs
-- are no longer accepted through either exposed or private-schema functions.
create or replace function public.record_case_study_view(p_case_id uuid,p_visitor_id uuid default null) returns bigint language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null then return null;end if;return jsa_metrics_private.record_case_view(p_case_id,null);end $$;
create or replace function public.record_public_jsa_engagement(p_project_id uuid,p_kind text,p_visitor_id uuid default null,p_steps integer[] default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null then return null;end if;return jsa_metrics_private.record_engagement(p_project_id,p_kind,null,p_steps);end $$;
revoke execute on function jsa_metrics_private.record_case_view(uuid,uuid),jsa_metrics_private.record_engagement(uuid,text,uuid,integer[]) from public,anon,authenticated;
revoke execute on function public.record_case_study_view(uuid,uuid),public.record_public_jsa_engagement(uuid,text,uuid,integer[]) from public,anon;
grant execute on function public.record_case_study_view(uuid,uuid),public.record_public_jsa_engagement(uuid,text,uuid,integer[]) to authenticated;

create function jsa_private.external_support_admin(p_id uuid default null,p_status text default null,p_response text default null,p_expected timestamptz default null,p_offset integer default 0) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not coalesce(jsa_private.community_admin(),false) then raise exception 'ACCESS_DENIED';end if;
 if p_id is null then return coalesce((select jsonb_agg(to_jsonb(r)) from(select id,category,detail,evidence,status,response,created_at,updated_at from jsa_private.external_requests order by created_at desc,id limit 50 offset least(100000,greatest(0,p_offset)))r),'[]'::jsonb);end if;
 if p_status is null or p_status not in ('reviewing','resolved','declined') or length(coalesce(trim(p_response),'')) not between 10 and 2000 then raise exception 'INVALID_DECISION';end if;
 update jsa_private.external_requests set status=p_status,response=trim(p_response),updated_at=clock_timestamp() where id=p_id and updated_at=p_expected;
 if not found then raise exception 'STALE_REQUEST';end if;
 insert into jsa_private.external_request_audit(request_id,actor,action,response)values(p_id,auth.uid(),p_status,trim(p_response));
 return jsonb_build_object('ok',true);
end $$;
create function public.external_support_admin(p_id uuid default null,p_status text default null,p_response text default null,p_expected timestamptz default null,p_offset integer default 0) returns jsonb language sql set search_path='' as $$select jsa_private.external_support_admin(p_id,p_status,p_response,p_expected,p_offset)$$;
revoke all on function jsa_private.external_support_admin(uuid,text,text,timestamptz,integer),public.external_support_admin(uuid,text,text,timestamptz,integer) from public,anon;
grant execute on function jsa_private.external_support_admin(uuid,text,text,timestamptz,integer),public.external_support_admin(uuid,text,text,timestamptz,integer) to authenticated;
notify pgrst,'reload schema';
