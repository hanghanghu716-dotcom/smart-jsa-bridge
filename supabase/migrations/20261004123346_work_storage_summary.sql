-- Read-only usage. No user argument, no cross-account totals, no deletion grants.
create or replace function jsa_private.work_storage_summary()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := auth.uid(); result jsonb;
begin
 if actor is null then raise exception 'AUTH_REQUIRED'; end if;
 with owned as (
  select o.name,
   case when o.metadata->>'size' ~ '^[0-9]{1,15}$' then (o.metadata->>'size')::bigint else 0 end as bytes,
   exists(select 1 from public.work_drawings d where d.user_id=actor and d.object_path=o.name)
    or exists(select 1 from public.work_outputs p where p.user_id=actor and p.object_path=o.name) as registered
  from storage.objects o
  where o.bucket_id='work-bundle-assets' and o.name like actor::text || '/%'
 )
 select jsonb_build_object('files',count(*),'bytes',coalesce(sum(bytes),0),
  'unregisteredFiles',count(*) filter(where not registered),
  'unregisteredBytes',coalesce(sum(bytes) filter(where not registered),0)) into result from owned;
 return result;
end $$;
revoke all on function jsa_private.work_storage_summary() from public,anon,authenticated;
grant execute on function jsa_private.work_storage_summary() to authenticated;
create or replace function public.work_storage_summary()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select jsa_private.work_storage_summary() $$;
revoke all on function public.work_storage_summary() from public,anon,authenticated;
grant execute on function public.work_storage_summary() to authenticated;
notify pgrst,'reload schema';
