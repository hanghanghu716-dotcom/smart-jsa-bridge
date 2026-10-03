-- Rollback-only integration checks against all production RLS/RPC boundaries.
begin;
create temporary table qa6 as select (array_agg(id order by id))[1] owner_id,(array_agg(id order by id))[2] reviewer_id,(array_agg(id order by id))[3] viewer_id,(array_agg(id order by id))[4] outsider_id, gen_random_uuid() project_id,null::uuid org_id,null::uuid doc_id,null::text review_token,null::text view_token,null::timestamptz expiry from auth.users;
grant all on qa6 to authenticated;
select set_config('request.jwt.claim.sub',(select owner_id::text from qa6),true);
set local role authenticated;
do $$ declare result jsonb; v integer; begin
 result=public.jsa_business_action('start_beta',p_payload:='{"plan":"business","expires_at":"2099-01-01"}');
 update qa6 set expiry=(result->>'expires_at')::timestamptz;
 result=public.jsa_business_action('start_beta');
 if (result->>'expires_at')::timestamptz<>(select expiry from qa6) then raise exception 'beta extension permitted'; end if;
 begin update public.jsa_beta_access set expires_at='2099-01-01'; raise exception 'direct beta write permitted'; exception when insufficient_privilege then null; end;
 result=public.jsa_business_action('create_org',p_payload:='{"name":"Rollback test organization"}'); update qa6 set org_id=(result->>'id')::uuid;
 result=public.jsa_business_action('invite',(select org_id from qa6),p_payload:='{"role":"reviewer"}');update qa6 set review_token=result->>'token';
 result=public.jsa_business_action('invite',(select org_id from qa6),p_payload:='{"role":"viewer"}');update qa6 set view_token=result->>'token';
end $$;
insert into public.jsa_projects(id,author_id,user_id,title,is_public,form_data,analysis_data,custom_layout) select project_id,owner_id,owner_id,'Revision one',false,'{"projectName":"Revision one","jsaType":"3-step"}','[]','{}' from qa6;
update public.jsa_projects set title='Revision two',form_data='{"projectName":"Revision two"}',updated_at=clock_timestamp() where id=(select project_id from qa6);
do $$ declare result jsonb; before_time timestamptz; begin
 if (select count(*) from public.jsa_project_revisions where project_id=(select project_id from qa6))<>2 then raise exception 'personal history missing'; end if;
 select updated_at into before_time from public.jsa_projects where id=(select project_id from qa6);
 result=public.jsa_business_action('restore_personal',p_doc:=(select project_id from qa6),p_payload:=jsonb_build_object('revision',(select min(id) from public.jsa_project_revisions where project_id=(select project_id from qa6)),'updatedAt',before_time));
 if result->>'title'<>'Revision one' then raise exception 'restore incorrect'; end if;
 begin perform public.jsa_business_action('restore_personal',p_doc:=(select project_id from qa6),p_payload:=jsonb_build_object('revision',(select min(id) from public.jsa_project_revisions where project_id=(select project_id from qa6)),'updatedAt',before_time)); raise exception 'stale restore permitted'; exception when others then if sqlerrm<>'VERSION_CONFLICT' then raise; end if; end;
 result=public.jsa_business_action('import_document',(select org_id from qa6),p_payload:=jsonb_build_object('project_id',(select project_id from qa6))); update qa6 set doc_id=(result->>'id')::uuid;
 result=public.jsa_business_action('save_template',(select org_id from qa6),p_payload:='{"name":"Company form","layout":{"docTitle":"Company","stepPhotos":{"1":"private"},"projectSaveContext":{"id":"private"}}}');
 if exists(select 1 from public.jsa_org_templates where id=(result->>'id')::uuid and (layout_data?'stepPhotos' or layout_data?'projectSaveContext')) then raise exception 'template contains document data'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select reviewer_id::text from qa6),true);
set local role authenticated;
select public.jsa_business_action('join',p_payload:=jsonb_build_object('token',(select review_token from qa6)));
reset role;
select set_config('request.jwt.claim.sub',(select viewer_id::text from qa6),true);
set local role authenticated;
select public.jsa_business_action('join',p_payload:=jsonb_build_object('token',(select view_token from qa6)));
do $$ begin
 if (select count(*) from public.jsa_org_documents where org_id=(select org_id from qa6))<>1 then raise exception 'member cannot read'; end if;
 begin perform public.jsa_business_action('reopen',(select org_id from qa6),(select doc_id from qa6),1);raise exception 'viewer write permitted';exception when others then if sqlerrm<>'ACCESS_DENIED' then raise; end if;end;
 begin update public.jsa_org_documents set state='approved';raise exception 'direct write permitted';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select owner_id::text from qa6),true);
set local role authenticated;
do $$ begin
 begin perform public.jsa_business_action('submit',(select org_id from qa6),(select doc_id from qa6),1,jsonb_build_object('reviewer_id',(select owner_id from qa6)));raise exception 'self review permitted';exception when others then if sqlerrm<>'REVIEWER_REQUIRED' then raise;end if;end;
 perform public.jsa_business_action('submit',(select org_id from qa6),(select doc_id from qa6),1,jsonb_build_object('reviewer_id',(select reviewer_id from qa6)));
 begin perform public.jsa_business_action('import_document',(select org_id from qa6),(select doc_id from qa6),2,jsonb_build_object('project_id',(select project_id from qa6)));raise exception 'pending document changed';exception when others then if sqlerrm<>'DOCUMENT_LOCKED' then raise;end if;end;
 begin perform public.jsa_business_action('approve',(select org_id from qa6),(select doc_id from qa6),2);raise exception 'self approval permitted';exception when others then if sqlerrm<>'ACCESS_DENIED' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select reviewer_id::text from qa6),true);
set local role authenticated;
do $$ begin
 perform public.jsa_business_action('approve',(select org_id from qa6),(select doc_id from qa6),2,'{"comment":"Checked"}');
 begin perform public.jsa_business_action('approve',(select org_id from qa6),(select doc_id from qa6),2);raise exception 'stale approval permitted';exception when others then if sqlerrm<>'VERSION_CONFLICT' then raise;end if;end;
 if (select count(*) from public.jsa_org_revisions where document_id=(select doc_id from qa6))<>3 then raise exception 'audit history missing';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select outsider_id::text from qa6),true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.jsa_org_documents where org_id=(select org_id from qa6)) or exists(select 1 from public.jsa_org_revisions where org_id=(select org_id from qa6)) then raise exception 'cross organization leak';end if;
 begin perform public.jsa_business_action('join',p_payload:=jsonb_build_object('token',(select review_token from qa6)));raise exception 'invite reused';exception when others then if sqlerrm<>'INVITE_UNAVAILABLE' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select owner_id::text from qa6),true);
set local role authenticated;
do $$ declare other_org uuid; begin
 -- Restore approved content as a fresh draft, preserving the approved event.
 perform public.jsa_business_action('restore_revision',(select org_id from qa6),(select doc_id from qa6),3,jsonb_build_object('revision',(select min(id) from public.jsa_org_revisions where document_id=(select doc_id from qa6))));
 if not exists(select 1 from public.jsa_org_revisions where document_id=(select doc_id from qa6) and version=3 and state='approved') then raise exception 'approved history changed';end if;
 if (select state from public.jsa_org_documents where id=(select doc_id from qa6))<>'draft' then raise exception 'restoration retained approval';end if;
 other_org=(public.jsa_business_action('create_org',p_payload:='{"name":"Other rollback organization"}')->>'id')::uuid;
 begin perform public.jsa_business_action('reopen',other_org,(select doc_id from qa6),4);raise exception 'cross organization target accepted';exception when others then if sqlerrm<>'NOT_FOUND' then raise;end if;end;
 perform public.jsa_business_action('submit',(select org_id from qa6),(select doc_id from qa6),4,jsonb_build_object('reviewer_id',(select reviewer_id from qa6)));
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select reviewer_id::text from qa6),true);
set local role authenticated;
do $$ begin
 begin perform public.jsa_business_action('reject',(select org_id from qa6),(select doc_id from qa6),5);raise exception 'empty change request accepted';exception when others then if sqlerrm<>'COMMENT_REQUIRED' then raise;end if;end;
 perform public.jsa_business_action('reject',(select org_id from qa6),(select doc_id from qa6),5,'{"comment":"Add site controls"}');
end $$;
reset role;
update public.jsa_beta_access set expires_at=now()-interval '1 second' where user_id=(select owner_id from qa6);
select set_config('request.jwt.claim.sub',(select owner_id::text from qa6),true);
set local role authenticated;
do $$ begin
 begin perform public.jsa_business_action('reopen',(select org_id from qa6),(select doc_id from qa6),6);raise exception 'expired write permitted';exception when others then if sqlerrm<>'BETA_EXPIRED' then raise;end if;end;
 if (select count(*) from public.jsa_org_documents where org_id=(select org_id from qa6))<>1 then raise exception 'expired read denied';end if;
 perform public.jsa_business_action('remove_member',(select org_id from qa6),p_payload:=jsonb_build_object('user_id',(select viewer_id from qa6)));
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select viewer_id::text from qa6),true);
set local role authenticated;
do $$ begin if exists(select 1 from public.jsa_org_documents where org_id=(select org_id from qa6)) then raise exception 'removed member retained access';end if;end $$;
reset role;
select 'PASS: nonrenewable beta, blocked direct writes, personal restore/CAS, private imports, sanitized templates, one-use invites, roles, immutable submitted documents, self-approval rejection, approval history, tenant isolation, expiry and revocation' as result;
rollback;
