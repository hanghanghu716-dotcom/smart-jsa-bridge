begin;

-- Billing identifiers never enter public REST tables or browser-readable views.
create table jsa_private.billing_orders (
 id text primary key check (id ~ '^jsa_(test|live)_[0-9a-f-]{36}$'),
 user_id uuid not null references auth.users(id),
 mode text not null check (mode in ('test','live')),
 amount integer not null check (amount = 9900),
 currency text not null default 'KRW' check (currency = 'KRW'),
 terms_version text not null check (length(terms_version) between 1 and 1000),
 status text not null default 'PENDING' check (status in ('PENDING','DONE','CANCELED','PARTIAL_CANCELED','ABORTED','EXPIRED')),
 payment_key text check (length(payment_key) between 1 and 200),
 balance integer check (balance between 0 and 9900),
 created_at timestamptz not null default now(),
 checkout_expires_at timestamptz not null default now() + interval '30 minutes',
 approved_at timestamptz,
 starts_at timestamptz,
 expires_at timestamptz,
 checked_at timestamptz,
 refund_requested_at timestamptz,
 unique(mode,payment_key),
 check ((starts_at is null) = (expires_at is null)),
 check (expires_at is null or expires_at = starts_at + interval '30 days')
);
alter table jsa_private.billing_orders enable row level security;
revoke all on jsa_private.billing_orders from public,anon,authenticated;
create index billing_orders_account on jsa_private.billing_orders(user_id,mode,created_at desc);
create index billing_orders_active on jsa_private.billing_orders(user_id,expires_at) where mode='live' and status='DONE';

create or replace function jsa_private.professional_access(p_user uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 with expiry as (
  select (select expires_at from public.jsa_beta_access where user_id=p_user) trial,
   (select max(expires_at) from jsa_private.billing_orders where user_id=p_user and mode='live' and status='DONE' and starts_at<=now()) paid
 ) select jsonb_build_object('active',coalesce(greatest(trial,paid)>now(),false),
  'expires_at',greatest(trial,paid),'paid_expires_at',paid,'trial_expires_at',trial,
  'source',case when paid>now() and (trial is null or paid>=trial) then 'paid' when trial>now() then 'trial' else 'none' end)
 from expiry;
$$;
revoke all on function jsa_private.professional_access(uuid) from public,anon,authenticated;

-- Existing server-enforced write gates and revision triggers use this helper.
-- Test orders categorically cannot grant production access.
create or replace function jsa_private.beta_active(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select (jsa_private.professional_access(p_user)->>'active')::boolean;
$$;

create or replace function public.jsa_professional_access()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 return jsa_private.professional_access(auth.uid());
end;
$$;
revoke all on function public.jsa_professional_access() from public,anon;
grant execute on function public.jsa_professional_access() to authenticated;

create or replace function public.jsa_billing_service(p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid := (p_payload->>'user_id')::uuid;
 payment jsa_private.billing_orders;
 result jsonb;
 access jsonb;
 start_time timestamptz;
 next_status text := p_payload->>'status';
begin
 if auth.role() is distinct from 'service_role' then raise exception 'ACCESS_DENIED'; end if;
 if p_payload->>'mode' not in ('test','live') or jsonb_typeof(p_payload)<>'object' then raise exception 'INVALID_INPUT'; end if;
 if p_action='sweep' then
  select coalesce(jsonb_agg(to_jsonb(o)),'[]'::jsonb) into result from
   (select * from jsa_private.billing_orders where mode=p_payload->>'mode' and payment_key is not null
    and ((status='PENDING' and created_at>now()-interval '7 days') or (status in ('DONE','PARTIAL_CANCELED') and expires_at>now()-interval '7 days'))
    and (checked_at is null or checked_at<now()-interval '23 hours') order by checked_at nulls first,created_at limit 12) o;
  return result;
 elsif p_action='account' then
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at desc),'[]'::jsonb) into result from
   (select * from jsa_private.billing_orders where user_id=actor and mode=p_payload->>'mode' order by created_at desc limit 20) o;
  return jsonb_build_object('access',jsa_private.professional_access(actor),'orders',result);
 elsif p_action='create' then
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if (p_payload->>'amount')::integer is distinct from 9900 or p_payload->>'currency' is distinct from 'KRW' then raise exception 'INVALID_INPUT'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,70));
  access:=jsa_private.professional_access(actor);
  if (access->>'active')::boolean then raise exception 'ACCESS_ACTIVE'; end if;
  select * into payment from jsa_private.billing_orders where user_id=actor and mode=p_payload->>'mode' and status='PENDING'
   and checkout_expires_at>now() and terms_version=p_payload->>'terms_version' order by created_at desc limit 1;
  if found then return to_jsonb(payment); end if;
  insert into jsa_private.billing_orders(id,user_id,mode,amount,currency,terms_version)
   values(p_payload->>'order_id',actor,p_payload->>'mode',9900,'KRW',p_payload->>'terms_version') returning * into payment;
  return to_jsonb(payment);
 end if;

 select * into payment from jsa_private.billing_orders where id=p_payload->>'order_id' and mode=p_payload->>'mode' for update;
 if not found then
  if p_action='get' and actor is null then return null; end if;
  raise exception 'NOT_FOUND';
 end if;
 if actor is not null and actor<>payment.user_id then raise exception 'NOT_FOUND'; end if;
 if p_action='get' then return to_jsonb(payment); end if;
 if p_action='bind' then
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(length(p_payload->>'payment_key'),0) not between 1 and 200 then raise exception 'INVALID_INPUT'; end if;
  if payment.payment_key is not null and payment.payment_key is distinct from p_payload->>'payment_key' then raise exception 'PAYMENT_KEY_CONFLICT'; end if;
  if payment.payment_key is null and payment.checkout_expires_at<=now() then raise exception 'ORDER_EXPIRED'; end if;
  update jsa_private.billing_orders set payment_key=p_payload->>'payment_key' where id=payment.id returning * into payment;
  return to_jsonb(payment);
 elsif p_action='apply' then
  if payment.payment_key is null or payment.payment_key is distinct from p_payload->>'payment_key'
   or payment.amount is distinct from (p_payload->>'amount')::integer or payment.currency is distinct from p_payload->>'currency'
   or next_status not in ('DONE','CANCELED','PARTIAL_CANCELED','ABORTED','EXPIRED') then raise exception 'PAYMENT_MISMATCH'; end if;
  -- Cancellation is terminal, including stale/out-of-order DONE observations.
  if payment.status='CANCELED' or (payment.status='PARTIAL_CANCELED' and next_status<>'CANCELED')
   or (payment.status='DONE' and next_status in ('ABORTED','EXPIRED')) then return to_jsonb(payment); end if;
  if next_status='DONE' and payment.starts_at is null then
   if p_payload->>'approved_at' is null or (p_payload->>'balance')::integer is distinct from payment.amount then raise exception 'PAYMENT_MISMATCH'; end if;
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(payment.user_id::text,70));
   -- A recovered charge receives its full service period; retries never extend it.
   select greatest(now(),max(expires_at)) into start_time from jsa_private.billing_orders
    where user_id=payment.user_id and mode=payment.mode and status='DONE';
   if payment.mode='live' then
    start_time:=greatest(start_time,(select expires_at from public.jsa_beta_access where user_id=payment.user_id));
   end if;
   payment.starts_at:=start_time; payment.expires_at:=start_time+interval '30 days';
  end if;
  update jsa_private.billing_orders set status=next_status,balance=(p_payload->>'balance')::integer,
   approved_at=coalesce(approved_at,(p_payload->>'approved_at')::timestamptz),starts_at=payment.starts_at,expires_at=payment.expires_at,checked_at=now()
   where id=payment.id returning * into payment;
  return to_jsonb(payment);
 elsif p_action='refund' then
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if payment.status not in ('DONE','PARTIAL_CANCELED') then raise exception 'REFUND_UNAVAILABLE'; end if;
  update jsa_private.billing_orders set refund_requested_at=coalesce(refund_requested_at,now()) where id=payment.id returning * into payment;
  return to_jsonb(payment);
 end if;
 raise exception 'INVALID_INPUT';
end;
$$;
revoke all on function public.jsa_billing_service(text,jsonb) from public,anon,authenticated;
grant execute on function public.jsa_billing_service(text,jsonb) to service_role;

-- Upgrade the existing organization status branch without altering role rules,
-- version checks, approvals, or the single-use free trial.
do $migration$
declare definition text; before_fragment text; after_fragment text;
begin
 before_fragment:=$old$select jsonb_build_object('role',role_name,'expires_at',expires_at,'active',expires_at>now()) into result from public.jsa_beta_access where user_id=org.owner_id;
  return coalesce(result,jsonb_build_object('role',role_name,'active',false));$old$;
 after_fragment:=$new$return jsa_private.professional_access(org.owner_id) || jsonb_build_object('role',role_name);$new$;
 select pg_catalog.pg_get_functiondef('jsa_private.business_dispatch(text,uuid,uuid,integer,jsonb)'::regprocedure) into definition;
 if position(before_fragment in definition)=0 then raise exception 'Review business_dispatch before applying billing migration'; end if;
 execute replace(definition,before_fragment,after_fragment);
end;
$migration$;

notify pgrst,'reload schema';
commit;
