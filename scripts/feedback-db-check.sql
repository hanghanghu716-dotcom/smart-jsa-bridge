-- Transaction-only fixtures. No real ticket or uploaded object is retained.
begin;
do $test$
declare k text:='feedback-test-'||gen_random_uuid()::text||gen_random_uuid()::text;
 actor uuid:=gen_random_uuid(); token text:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 result jsonb; duplicate jsonb; saved jsonb; request_id uuid; p jsonb; object_path text; blocked boolean;
begin
 insert into jsa_private.public_gateway_keys(key_hash) values(sha256(convert_to(k,'UTF8')));
 p:=jsonb_build_object('category','case_request','title','Fixture: name only','detail','','consent',true,'files','[]'::jsonb,'locale','ko','country','KR','receipt',token);
 result:=public.feedback_gateway(k,actor,'feedback_prepare',p);
 if result->>'status'<>'draft' then raise exception 'ASSERT_DRAFT';end if;
 request_id:=(result->>'id')::uuid;
 duplicate:=public.feedback_gateway(k,actor,'feedback_prepare',p);
 if duplicate->>'id'<>request_id::text then raise exception 'ASSERT_IDEMPOTENCY';end if;
 saved:=public.feedback_gateway(k,actor,'feedback_submit',jsonb_build_object('id',request_id,'receipt',token));
 if saved->>'status'<>'open' then raise exception 'ASSERT_SUBMITTED';end if;
 if public.feedback_gateway(k,actor,'feedback_status',jsonb_build_object('id',request_id,'receipt',repeat('0',64)))->>'error'<>'NOT_FOUND' then raise exception 'ASSERT_RECEIPT_BOUNDARY';end if;
 if public.feedback_gateway(k,actor,'feedback_status',jsonb_build_object('id',request_id,'receipt',token)) ? 'internal_notes' then raise exception 'ASSERT_PRIVATE_NOTES';end if;
 token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 p:=p||jsonb_build_object('title','','receipt',token,'files',jsonb_build_array(jsonb_build_object('name','permit.pdf','type','application/pdf','size',128)));
 result:=public.feedback_gateway(k,actor,'feedback_prepare',p);request_id:=(result->>'id')::uuid;object_path:=result->'files'->0->>'path';
 if not jsa_private.feedback_upload_allowed(object_path) or jsa_private.feedback_upload_allowed(object_path||'wrong') then raise exception 'ASSERT_UPLOAD_CAPABILITY';end if;
 saved:=public.feedback_gateway(k,actor,'feedback_submit',jsonb_build_object('id',request_id,'receipt',token));
 if saved->>'error'<>'UPLOAD_INCOMPLETE' then raise exception 'ASSERT_NO_FALSE_RECEIPT';end if;
 update jsa_private.external_requests set created_at=now()-interval '25 hours' where id=request_id;
 if jsa_private.feedback_upload_allowed(object_path) then raise exception 'ASSERT_EXPIRED_UPLOAD';end if;
 if public.feedback_gateway(k,actor,'feedback_resume',jsonb_build_object('id',request_id,'receipt',token))->>'error'<>'EXPIRED' then raise exception 'ASSERT_EXPIRED_DRAFT';end if;
 blocked:=false;
 begin perform jsa_private.feedback_admin('list','{}');exception when others then if sqlerrm='ACCESS_DENIED' then blocked:=true;else raise;end if;end;
 if not blocked then raise exception 'ASSERT_ADMIN_AUTH';end if;
 blocked:=false;
 begin perform public.feedback_gateway('invalid',actor,'feedback_prepare',p);exception when others then if sqlerrm='ACCESS_DENIED' then blocked:=true;else raise;end if;end;
 if not blocked then raise exception 'ASSERT_SERVER_KEY';end if;
end $test$;
set local role anon;
do $test$
declare blocked boolean:=false;
begin
 begin perform public.feedback_admin('list','{}');exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'ASSERT_ANON_ADMIN';end if;
 blocked:=false;
 begin perform 1 from jsa_private.feedback_attachments;exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'ASSERT_ANON_TABLE';end if;
 if exists(select 1 from storage.objects where bucket_id='feedback-attachments') then raise exception 'ASSERT_ANON_FILE_READ';end if;
end $test$;
reset role;
rollback;
select 'PASS: idempotency, receipt secrecy, incomplete uploads, upload capabilities, expiry, admin and anonymous boundaries; fixtures rolled back' as result;
