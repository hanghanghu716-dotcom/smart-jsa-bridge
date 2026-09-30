begin;
create temporary table qa_quota as
 select u.id owner_id,(select id from auth.users where id<>u.id order by id limit 1) other_id,
 (select count(*)::int from public.jsa_projects where author_id=u.id and is_public is not true) initial_used,
 '{}'::uuid[] fixtures,gen_random_uuid() public_id,gen_random_uuid() other_project
 from auth.users u order by (select count(*) from public.jsa_projects where author_id=u.id and is_public is not true),u.id limit 1;
grant all on qa_quota to authenticated;
update public.jsa_beta_access set expires_at=clock_timestamp()-interval '1 day' where user_id=(select owner_id from qa_quota);
insert into public.jsa_projects(id,author_id,user_id,title,is_public,form_data,analysis_data) select other_project,other_id,other_id,'Other owner',true,'{}'::jsonb,'[]'::jsonb from qa_quota;
select set_config('request.jwt.claim.sub',(select owner_id::text from qa_quota),true);
set local role authenticated;
do $$ declare i integer; new_id uuid; before_count integer; changed integer; begin
 if (select initial_used from qa_quota)>=3 then raise exception 'Fixture needs an account below quota'; end if;
 for i in (select initial_used from qa_quota)..2 loop
  insert into public.jsa_projects(author_id,user_id,title,is_public,form_data,analysis_data) select owner_id,owner_id,'Quota rollback fixture',false,'{}'::jsonb,'[]'::jsonb from qa_quota returning id into new_id;
  update qa_quota set fixtures=array_append(fixtures,new_id);
 end loop;
 if (public.get_jsa_storage_usage()->>'used')::int<>3 then raise exception 'incorrect filled quota';end if;
 begin insert into public.jsa_projects(author_id,user_id,title,is_public,form_data,analysis_data) select owner_id,owner_id,'Fourth',false,'{}'::jsonb,'[]'::jsonb from qa_quota;raise exception 'fourth allowed';exception when others then if sqlerrm<>'FREE_PROJECT_LIMIT' then raise;end if;end;
 begin insert into public.jsa_projects(author_id,user_id,title,is_public,form_data,analysis_data) select owner_id,owner_id,'Null bypass',null,'{}'::jsonb,'[]'::jsonb from qa_quota;raise exception 'null allowed';exception when others then if sqlerrm<>'FREE_PROJECT_LIMIT' then raise;end if;end;
 insert into public.jsa_projects(id,author_id,user_id,title,is_public,form_data,analysis_data) select public_id,owner_id,owner_id,'Public fixture',true,'{}'::jsonb,'[]'::jsonb from qa_quota;
 begin update public.jsa_projects set is_public=false where id=(select public_id from qa_quota);raise exception 'private conversion allowed';exception when others then if sqlerrm<>'FREE_PROJECT_LIMIT' then raise;end if;end;
 update public.jsa_projects set title='Editing remains available' where id=(select fixtures[1] from qa_quota);
 -- ON CONFLICT must not reserve a second slot for the same existing record.
 insert into public.jsa_projects(id,author_id,user_id,title,is_public,form_data,analysis_data) select fixtures[1],owner_id,owner_id,'Duplicate',false,'{}'::jsonb,'[]'::jsonb from qa_quota on conflict(id) do nothing;
 insert into public.jsa_projects(id,author_id,user_id,title,is_public,form_data,analysis_data) select fixtures[1],owner_id,owner_id,'Upsert edit',false,'{}'::jsonb,'[]'::jsonb from qa_quota on conflict(id) do update set title=excluded.title;
 if (public.get_jsa_storage_usage()->>'used')::int<>3 then raise exception 'upsert drift';end if;
 begin update public.jsa_projects set user_id=(select other_id from qa_quota) where id=(select fixtures[1] from qa_quota);raise exception 'owner changed';exception when others then if sqlerrm<>'PROJECT_OWNER_IMMUTABLE' then raise;end if;end;
 begin insert into public.jsa_projects(author_id,user_id,title,form_data,analysis_data) select other_id,owner_id,'Forgery','{}'::jsonb,'[]'::jsonb from qa_quota;raise exception 'owner forgery allowed';exception when others then if sqlerrm<>'PROJECT_OWNER_INVALID' then raise;end if;end;
 update public.jsa_projects set title='Stolen' where id=(select other_project from qa_quota);get diagnostics changed=row_count;if changed<>0 then raise exception 'other project updated';end if;
 delete from public.jsa_projects where id=(select other_project from qa_quota);get diagnostics changed=row_count;if changed<>0 then raise exception 'other project deleted';end if;
 begin update jsa_private.project_storage_usage set private_count=0;raise exception 'counter tampered';exception when insufficient_privilege then null;end;
 delete from public.jsa_projects where id=(select fixtures[1] from qa_quota);
 if (public.get_jsa_storage_usage()->>'used')::int<>2 then raise exception 'deletion did not free slot';end if;
 -- A batch that exceeds the available slot must roll back in its entirety.
 begin insert into public.jsa_projects(author_id,user_id,title,is_public,form_data,analysis_data) select owner_id,owner_id,'Bulk overflow',false,'{}'::jsonb,'[]'::jsonb from qa_quota cross join generate_series(1,2);raise exception 'bulk overflow allowed';exception when others then if sqlerrm<>'FREE_PROJECT_LIMIT' then raise;end if;end;
 if (public.get_jsa_storage_usage()->>'used')::int<>2 then raise exception 'failed batch leaked reservations';end if;
 update public.jsa_projects set is_public=false where id=(select public_id from qa_quota);
 if (public.get_jsa_storage_usage()->>'used')::int<>3 then raise exception 'private conversion not counted';end if;
end $$;
reset role;
insert into public.jsa_beta_access(user_id,expires_at) select owner_id,clock_timestamp()+interval '1 day' from qa_quota on conflict(user_id) do update set expires_at=excluded.expires_at;
set local role authenticated;
insert into public.jsa_projects(author_id,user_id,title,is_public,form_data,analysis_data) select owner_id,owner_id,'Trial additional document',false,'{}'::jsonb,'[]'::jsonb from qa_quota;
do $$ begin if (public.get_jsa_storage_usage()->>'used')::int<>4 or (public.get_jsa_storage_usage()->>'trial_active')::boolean is not true then raise exception 'trial expansion failed';end if;end $$;
reset role;
update public.jsa_beta_access set expires_at=clock_timestamp()-interval '1 second' where user_id=(select owner_id from qa_quota);
set local role authenticated;
do $$ begin
 update public.jsa_projects set title='Still editable after expiry' where id=(select public_id from qa_quota);
 if (public.get_jsa_storage_usage()->>'can_create')::boolean then raise exception 'expired trial remained active';end if;
 begin insert into public.jsa_projects(author_id,user_id,title,is_public,form_data,analysis_data) select owner_id,owner_id,'Expired extra',false,'{}'::jsonb,'[]'::jsonb from qa_quota;raise exception 'expired extra allowed';exception when others then if sqlerrm<>'FREE_PROJECT_LIMIT' then raise;end if;end;
 if (select count(*) from public.jsa_projects where author_id=auth.uid() and is_public is not true)<>4 then raise exception 'existing documents lost';end if;
end $$;
reset role;
do $$ begin if exists(select 1 from jsa_private.project_storage_usage c where private_count<>(select count(*) from public.jsa_projects p where p.author_id=c.user_id and p.is_public is not true)) then raise exception 'counter drift';end if;end $$;
select 'PASS: Free cap, null visibility, copy/insert, private conversion, existing edits, upsert, bulk rollback, deletion, ownership, trial expansion/expiry and counter integrity' as result;
rollback;
