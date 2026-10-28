create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create table resource_private.collector_state(id boolean primary key default true check(id), lease_until timestamptz not null default '-infinity');
insert into resource_private.collector_state(id) values(true);
alter table resource_private.collector_state enable row level security;
revoke all on resource_private.collector_state from public,anon,authenticated;
do $$ begin
 if not exists(select 1 from vault.secrets where name='safety_resource_collector') then
 perform vault.create_secret(gen_random_uuid()::text||gen_random_uuid()::text,'safety_resource_collector','Private safety metadata collection only');
 end if;
end $$;
create function public.resource_collect(p_action text,p_token text,p_source text default '',p_items jsonb default '[]',p_status text default '') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='10s' as $$
declare credential text; s resource_private.sources; x jsonb; begin
 if auth.role() is distinct from 'service_role' then raise exception 'DENIED' using errcode='42501';end if;
 select decrypted_secret into credential from vault.decrypted_secrets where name='safety_resource_collector';
 if credential is null or p_token is null or extensions.digest(p_token,'sha256')<>extensions.digest(credential,'sha256') then raise exception 'DENIED' using errcode='42501';end if;
 if p_action='claim' then
 update resource_private.collector_state set lease_until=now()+interval '20 hours' where id and lease_until<now();
 if not found then return '[]';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'feed_url',feed_url,'domains',domains)) from resource_private.sources where active and review_until>now() and feed_url is not null),'[]');
 elsif p_action='commit' then
 select * into s from resource_private.sources where id=p_source and active and review_until>now() and feed_url is not null;
 if s.id is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>40 then raise exception 'INVALID_SOURCE';end if;
 for x in select * from jsonb_array_elements(p_items) loop
 if not resource_private.valid_url(x->>'url',s.domains) then raise exception 'INVALID_URL';end if;
 insert into resource_private.items(source_id,url,title,locale,source_date)
 values(s.id,x->>'url',x->>'title',s.locales[1],nullif(x->>'source_date','')::date) on conflict(url) do nothing;
 end loop;
 update resource_private.sources set last_collected_at=now(),collection_status=case when p_status='ok' then 'ok' else 'fetch_failed' end where id=s.id;
 return jsonb_build_object('ok',true);
 else raise exception 'INVALID_ACTION';end if;
end $$;
revoke all on function public.resource_collect(text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.resource_collect(text,text,text,jsonb,text) to service_role;
create function resource_private.dispatch_collection() returns bigint language sql security definer set search_path='' as $$
 select net.http_post(url:='https://aajvezmhyrdawxxbulqz.supabase.co/functions/v1/collect-safety-resources',
 headers:=jsonb_build_object('Content-Type','application/json','x-resource-token',(select decrypted_secret from vault.decrypted_secrets where name='safety_resource_collector')),
 body:='{}'::jsonb,timeout_milliseconds:=60000);
$$;
revoke all on function resource_private.dispatch_collection() from public,anon,authenticated,service_role;
-- 06:15 UTC daily. Secrets are resolved in Vault at execution, never stored in cron text.
select cron.schedule('safety-resource-metadata','15 6 * * *','select resource_private.dispatch_collection();');
