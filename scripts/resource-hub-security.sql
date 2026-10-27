begin;
do $$
declare a uuid; b uuid; result jsonb; n integer; begin
 select id into a from auth.users order by created_at,id limit 1;
 select id into b from auth.users where id<>a order by created_at,id limit 1;
 if a is null or b is null then raise exception 'Two existing accounts required for isolation check';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','aal','aal1')::text,true);
 perform public.resource_follows('follow','en-US','chemical');
 result:=public.resource_follows();
 if not result @> '[{"locale":"en-US","topic":"chemical"}]'::jsonb then raise exception 'Follow not stored';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','aal','aal1')::text,true);
 if public.resource_follows() @> '[{"locale":"en-US","topic":"chemical"}]'::jsonb then raise exception 'Cross-account subscription leak';end if;
 begin perform public.resource_admin('list');raise exception 'ADMIN_BYPASS';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{}',true);
 begin perform public.resource_follows('follow','en-US','general');raise exception 'ANON_FOLLOW_BYPASS';exception when insufficient_privilege then null;end;
 update resource_private.sources set active=false where id='official-en-us';
 if jsonb_array_length(public.resource_hub('en-US')->'items')<>0 then raise exception 'WITHDRAWAL_LEAK';end if;
 update resource_private.sources set active=true where id='official-en-us';
 update resource_private.items set summary='unlicensed copied text' where source_id='official-en-us';
 if jsonb_array_length(public.resource_hub('en-US')->'items')<>0 then raise exception 'RIGHTS_GATE_BYPASS';end if;
 update resource_private.items set summary='',state='pending' where source_id='official-en-us';
 if jsonb_array_length(public.resource_hub('en-US')->'items')<>0 then raise exception 'PENDING_LEAK';end if;
 update resource_private.items set state='published',review_until=now()-interval '1 minute' where source_id='official-en-us';
 if jsonb_array_length(public.resource_hub('en-US')->'items')<>0 then raise exception 'EXPIRY_LEAK';end if;
 if has_table_privilege('anon','resource_private.items','select') or has_table_privilege('authenticated','resource_private.items','update') then raise exception 'RAW_TABLE_ACCESS';end if;
 if has_function_privilege('anon','public.resource_collect(text,text,text,jsonb,text)','execute') or has_function_privilege('authenticated','public.resource_collect(text,text,text,jsonb,text)','execute') then raise exception 'COLLECTOR_PUBLIC';end if;
end $$;
rollback;
select 'PASS: ownership, admin denial, anonymous denial, withdrawal, permission gate, pending/expired visibility, raw table isolation and collector grants; rolled back' as result;
