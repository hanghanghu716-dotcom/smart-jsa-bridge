begin;
create temporary table engagement_qa as select (array_agg(id order by id))[1] owner_id,(array_agg(id order by id))[2] reader_id,gen_random_uuid() public_id,gen_random_uuid() private_id,gen_random_uuid() visitor from auth.users;
grant select on engagement_qa to anon,authenticated;
insert into public.jsa_projects(id,author_id,user_id,title,is_public,form_data,analysis_data)
select public_id,owner_id,owner_id,'Engagement rollback fixture',true,'{}','[{"proc":{"stepTitle":"One"}},{"proc":{"stepTitle":"Two"}}]' from engagement_qa;
insert into public.jsa_projects(id,author_id,user_id,title,is_public,form_data,analysis_data)
select private_id,owner_id,owner_id,'Private engagement fixture',false,'{}','[]' from engagement_qa;
create temporary table original_version as select updated_at from public.jsa_projects where id=(select public_id from engagement_qa);
set local role anon;
select public.record_public_jsa_engagement(public_id,'view',visitor) from engagement_qa;
select public.record_public_jsa_engagement(public_id,'view',visitor) from engagement_qa;
select public.record_public_jsa_engagement(public_id,'reuse',visitor,array[0,1]) from engagement_qa;
do $$begin
if (select view_count from public.public_jsa_catalog where id=(select public_id from engagement_qa))<>1 then raise exception 'anonymous dedupe';end if;
if (select reuse_count from public.public_jsa_catalog where id=(select public_id from engagement_qa))<>0 then raise exception 'anonymous reuse';end if;
if public.record_public_jsa_engagement((select private_id from engagement_qa),'view',(select visitor from engagement_qa)) is not null then raise exception 'private tracking';end if;
begin insert into public.public_jsa_metrics(project_id,view_count) select public_id,999 from engagement_qa;raise exception 'direct metrics insert';exception when insufficient_privilege then null;end;
begin perform * from jsa_metrics_private.events;raise exception 'event privacy';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select reader_id::text from engagement_qa),true);
set local role authenticated;
select public.record_public_jsa_engagement(public_id,'reuse',visitor,array[0,1,1,999,-1]) from engagement_qa;
select public.record_public_jsa_engagement(public_id,'reuse',gen_random_uuid(),array[0,1]) from engagement_qa;
select public.record_public_jsa_engagement(public_id,'view',visitor) from engagement_qa;
select public.record_public_jsa_engagement(public_id,'view',gen_random_uuid()) from engagement_qa;
do $$begin
if (select reuse_count from public.public_jsa_catalog where id=(select public_id from engagement_qa))<>2 then raise exception 'step validation/dedupe';end if;
if (select view_count from public.public_jsa_catalog where id=(select public_id from engagement_qa))<>2 then raise exception 'account dedupe';end if;
begin update public.public_jsa_metrics set reuse_count=999 where project_id=(select public_id from engagement_qa);raise exception 'direct metric update';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select owner_id::text from engagement_qa),true);
set local role authenticated;
select public.record_public_jsa_engagement(public_id,'view',visitor) from engagement_qa;
select public.record_public_jsa_engagement(public_id,'reuse',visitor,array[0,1]) from engagement_qa;
do $$begin
if (select view_count+reuse_count from public.public_jsa_catalog where id=(select public_id from engagement_qa))<>4 then raise exception 'own metrics';end if;
end $$;
reset role;
do $$begin
if (select updated_at from public.jsa_projects where id=(select public_id from engagement_qa)) is distinct from (select updated_at from original_version) then raise exception 'metrics modified document';end if;
end $$;
update public.jsa_projects set is_public=false where id=(select public_id from engagement_qa);
set local role anon;
do $$begin
if exists(select 1 from public.public_jsa_catalog where id=(select public_id from engagement_qa)) then raise exception 'withdrawal catalog leak';end if;
if exists(select 1 from public.public_jsa_metrics where project_id=(select public_id from engagement_qa)) then raise exception 'withdrawal metrics leak';end if;
end $$;
reset role;
select 'PASS: view dedupe, authenticated step reuse, index validation, own exclusion, permissions, private visibility, unchanged document version' as result;
rollback;
