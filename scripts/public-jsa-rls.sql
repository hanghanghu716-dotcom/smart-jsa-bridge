-- Run through a privileged SQL connection; all fixtures are rolled back.
begin;
create temporary table qa5 as select (array_agg(id order by id))[1] owner_id,(array_agg(id order by id))[2] reader_id,gen_random_uuid() public_id,gen_random_uuid() private_id from auth.users;
grant select on qa5 to authenticated, anon;
insert into public.jsa_projects(id,author_id,user_id,title,is_public,form_data,analysis_data) select public_id,owner_id,owner_id,'Phase 5 rollback fixture',true,'{}','[]' from qa5;
insert into public.jsa_projects(id,author_id,user_id,title,is_public,form_data,analysis_data) select private_id,owner_id,owner_id,'Private rollback fixture',false,'{}','[]' from qa5;
set local role anon;
do $$ begin
 if (select count(*) from public.jsa_projects where id in(select public_id from qa5 union select private_id from qa5))<>1 then raise exception 'anonymous visibility failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select reader_id::text from qa5),true);
set local role authenticated;
insert into public.user_favorites(user_id,project_id) select reader_id,public_id from qa5 on conflict(user_id,project_id) do nothing;
insert into public.user_favorites(user_id,project_id) select reader_id,public_id from qa5 on conflict(user_id,project_id) do nothing;
select public.increment_scrap_count((select public_id from qa5));
do $$ begin
 if (select scrap_count from public.jsa_projects where id=(select public_id from qa5))<>1 then raise exception 'duplicate count failed'; end if;
 begin
   insert into public.user_favorites(user_id,project_id) select reader_id,private_id from qa5;
   raise exception 'private save permitted';
 exception when insufficient_privilege then null; end;
end $$;
delete from public.user_favorites where project_id=(select public_id from qa5);
do $$ begin if (select scrap_count from public.jsa_projects where id=(select public_id from qa5))<>0 then raise exception 'delete count failed'; end if; end $$;
reset role;
update public.jsa_projects set is_public=false where id=(select public_id from qa5);
set local role anon;
do $$ begin if exists(select 1 from public.jsa_projects where id=(select public_id from qa5)) then raise exception 'withdrawn public read permitted'; end if; end $$;
reset role;
select 'PASS: anonymous visibility, withdrawal, repeated scraps, count deletion, private save rejection' as result;
rollback;
