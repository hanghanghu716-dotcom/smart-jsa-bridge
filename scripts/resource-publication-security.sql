-- Run after jobs-security.sql's fixture in the same rollback transaction.
do $$
declare source_id text:='fixture-auto-'||gen_random_uuid(); item_id uuid; pending_id uuid; claims text:=current_setting('request.jwt.claims'); data jsonb; begin
 if has_function_privilege('anon','public.resource_publication(text,text,boolean)','execute') then raise exception 'PUBLIC_WRITE_GRANT';end if;
 perform set_config('request.jwt.claims','{}',true);
 begin perform public.resource_publication('automatic',source_id,true);raise exception 'ADMIN_BYPASS';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims',claims,true);
 insert into resource_private.sources(id,name,locales,domains,home_url,commercial,collection,automatic_publication)
 values(source_id,'Publication test',array['en-GB'],array['official.example'],'https://official.example',true,
 jsonb_build_object('enabled',true,'mode','feed','review_until',now()+interval '30 days'),
 jsonb_build_object('eligible',true,'enabled',true,'review_until',now()+interval '30 days','evidence_url','https://official.example/licence','attribution','Source: fixture official example. Test attribution.'));
 insert into resource_private.items(source_id,url,title,locale,source_date,collection_provenance)
 values(source_id,'https://official.example/'||source_id,'Safety announcement fixture','en-GB',current_date,'{"mode":"feed"}') returning id into item_id;
 if not exists(select 1 from resource_private.items where id=item_id and state='published' and checked_at is null and checked_by is null and checks='{"automatic":true}') then raise exception 'AUTOMATIC_OR_FALSE_HUMAN_REVIEW';end if;
 if not exists(select 1 from jsonb_array_elements(public.resource_home('en-GB')->'news')i where i->>'id'=item_id::text) then raise exception 'HOME_MISSING';end if;
 if exists(select 1 from jsonb_array_elements(public.resource_home('ko')->'news')i where i->>'id'=item_id::text) then raise exception 'HOME_COUNTRY_LEAK';end if;
 perform public.resource_publication('withdraw',item_id::text);
 insert into resource_private.items(source_id,url,title,locale,source_date,collection_provenance)
 values(source_id,'https://official.example/'||source_id,'Reimported fixture title','en-GB',current_date,'{"mode":"feed"}') on conflict(url) do nothing;
 if exists(select 1 from resource_private.items where id=item_id and state<>'withdrawn') then raise exception 'REIMPORT_RESTORED_WITHDRAWN';end if;
 perform public.resource_publication('restore',item_id::text);
 if not exists(select 1 from resource_private.items where id=item_id and state='published') then raise exception 'RESTORE_FAILED';end if;
 perform public.resource_publication('automatic',source_id,false);
 if exists(select 1 from jsonb_array_elements(public.resource_home('en-GB')->'news')i where i->>'id'=item_id::text) then raise exception 'DISABLED_AUTO_VISIBLE';end if;
 perform public.resource_publication('automatic',source_id,true);
 insert into resource_private.items(source_id,url,title,locale,source_date,collection_provenance)
 values(source_id,'https://official.example/missing-'||source_id,'Safety undated fixture','en-GB',null,'{"mode":"feed"}') returning id into pending_id;
 if exists(select 1 from resource_private.items where id=pending_id and state='published') then raise exception 'UNDATED_PUBLISHED';end if;
 insert into resource_private.items(source_id,url,title,locale,source_date,collection_provenance)
 values(source_id,'https://official.example/placeholder-'||source_id,'Fixture — link awaiting review','en-GB',current_date,'{"mode":"feed"}') returning id into pending_id;
 if exists(select 1 from resource_private.items where id=pending_id and state='published') then raise exception 'PLACEHOLDER_PUBLISHED';end if;
 insert into resource_private.items(source_id,url,title,locale,source_date,collection_provenance)
 values(source_id,'https://official.example/country-'||source_id,'Wrong country safety fixture','ko',current_date,'{"mode":"feed"}') returning id into pending_id;
 if exists(select 1 from resource_private.items where id=pending_id and state='published') then raise exception 'WRONG_COUNTRY_PUBLISHED';end if;
 perform public.resource_publication('withdraw',item_id::text);
 update resource_private.sources set review_until=now() where id=source_id;
 begin perform public.resource_publication('restore',item_id::text);raise exception 'EXPIRED_RESTORED';exception when others then if sqlerrm<>'PUBLICATION_REVIEW_REQUIRED' then raise;end if;end;
end $$;
