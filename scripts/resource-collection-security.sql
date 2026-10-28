-- All fixtures roll back. Production credentials are never retrieved by tests.
begin;
do $$
declare row_id uuid; u text; begin
 perform set_config('request.jwt.claims','{"role":"authenticated"}',true);
 begin perform public.resource_collect('claim','wrong');raise exception 'AUTH_BYPASS';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 begin perform public.resource_collect('claim','wrong');raise exception 'TOKEN_BYPASS';exception when insufficient_privilege then null;end;
 u='https://www.inrs.fr/actualites/collection-fixture-'||gen_random_uuid()||'.html';
 insert into resource_private.items(source_id,url,title,locale,collection_provenance)
 values('official-fr-fr',u,'INRS — link awaiting review','fr-FR','{"mode":"links","placeholder":"INRS — link awaiting review"}') returning id into row_id;
 begin update resource_private.items set state='published' where id=row_id;raise exception 'PLACEHOLDER_PUBLISHED';exception when others then if sqlerrm<>'ORIGINAL_LINK_LABEL_REQUIRED' then raise;end if;end;
 update resource_private.items set title='Original operator link label',state='published' where id=row_id;
 if exists(select 1 from jsonb_array_elements(public.resource_hub('fr-FR')->'items') x where x->>'id'=row_id::text) then raise exception 'UNREVIEWED_ITEM_VISIBLE';end if;
 if has_table_privilege('anon','resource_private.sources','select') or has_table_privilege('authenticated','resource_private.items','update') then raise exception 'RAW_ACCESS';end if;
 if has_function_privilege('authenticated','public.resource_collect(text,text,text,jsonb,text)','execute') then raise exception 'COLLECTOR_GRANT';end if;
end $$;
rollback;
select 'PASS: collector role/credential rejection, placeholder publication guard, unreviewed visibility and private table/collector permissions; fixtures rolled back' as result;
