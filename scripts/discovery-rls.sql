-- Execute the entire file; all fixtures and review decisions roll back.
begin;
-- Supply test.owner as a session setting for a dedicated test account before running.
do $$begin if nullif(current_setting('test.owner',true),'') is null then raise exception 'Missing test.owner account UUID';end if;end $$;
select set_config('test.admin',(select id::text from auth.users where raw_app_meta_data->>'role'='admin' limit 1),true);
select set_config('test.source',gen_random_uuid()::text,true),set_config('test.child',gen_random_uuid()::text,true);
insert into public.jsa_projects(id,author_id,user_id,title,is_public,public_locale,analysis_data,reuse_license,tags,created_at)
values(current_setting('test.source')::uuid,current_setting('test.owner')::uuid,current_setting('test.owner')::uuid,'Rollback discovery source',true,'ko',
 '[{"proc":{"stepTitle":"Isolate equipment","stepDetail":"Identify every supply, lock and label isolation points, verify zero energy with suitable calibrated equipment, document the result and obtain the supervisor confirmation before proceeding with inspection of the enclosed machinery."},"risks":[{"factor":"Unexpected energisation during inspection of machinery","current_measure":"Apply isolation locks and independently verify that all electrical and hydraulic energy is safely released before any maintenance activity begins."}]}]','community-v1',array['ROLLBACK_ONLY_DISCOVERY'],now()-interval '1 day');
insert into public.jsa_projects(id,author_id,user_id,title,is_public,public_locale,analysis_data,reuse_license,tags,parent_id)
select current_setting('test.child')::uuid,author_id,user_id,'Rollback discovery child',true,public_locale,analysis_data,reuse_license,tags,id from public.jsa_projects where id=current_setting('test.source')::uuid;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$declare a jsonb;begin
 select assessment into a from public.public_jsa_catalog where id=current_setting('test.child')::uuid;
 if a->>'duplicate_of' is distinct from current_setting('test.source') then raise exception 'duplicate not detected';end if;
 if public.discovery_links(current_setting('test.child')::uuid)->'source'->>'title'<>'Rollback discovery source' then raise exception 'source title missing';end if;
 begin perform public.discovery_admin('dashboard');raise exception 'anonymous analytics leak';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- A small text edit still forms a near-duplicate candidate, not only an exact hash.
update public.jsa_projects set analysis_data=jsonb_set(analysis_data,'{0,proc,stepDetail}',to_jsonb((analysis_data->0->'proc'->>'stepDetail')||' Record checks.')) where id=current_setting('test.child')::uuid;
do $$begin
 if (select assessment->>'duplicate_of' from public.public_jsa_catalog where id=current_setting('test.child')::uuid) is distinct from current_setting('test.source') then raise exception 'near duplicate not detected';end if;
end $$;
insert into jsa_metrics_private.events(project_id,actor,event_day,step_index) values
 (current_setting('test.child')::uuid,'rollback-discovery-actor',(now() at time zone 'UTC')::date,0),
 (current_setting('test.source')::uuid,'rollback-discovery-actor',(now() at time zone 'UTC')::date,0);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
do $$begin
 begin perform public.discovery_admin('dashboard');raise exception 'member analytics leak';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
select public.discovery_admin('review',current_setting('test.source')::uuid,jsonb_build_object('state','approved','reason','Rollback only editorial review','revision',(select assessment->>'revision' from public.public_jsa_catalog where id=current_setting('test.source')::uuid)));
select public.discovery_admin('link',current_setting('test.source')::uuid,'{"kind":"guide","target":"common"}');
select public.discovery_admin('search_month',null,jsonb_build_object('month',date_trunc('month',now())::date,'clicks',7,'source','Rollback test Search Console input'));
do $$begin
 if jsonb_array_length(public.discovery_admin('dashboard'))<>12 then raise exception 'monthly series missing';end if;
 if (public.discovery_admin('dashboard')->0->>'reused_steps')::int<2 then raise exception 'reuse events missing';end if;
 if public.discovery_admin('dashboard')->0->>'search_clicks'<>'7' then raise exception 'monthly search missing';end if;
 begin perform public.discovery_admin('review',current_setting('test.source')::uuid,'{"state":"approved","reason":"Rollback stale revision test","revision":"old"}');raise exception 'stale review accepted';exception when others then if sqlerrm<>'CONTENT_CHANGED' then raise;end if;end;
end $$;
reset role;
update public.jsa_projects set title='Rollback revised source' where id=current_setting('test.source')::uuid;
do $$begin
 if (select assessment->>'review' from public.public_jsa_catalog where id=current_setting('test.source')::uuid)<>'stale' then raise exception 'approval not invalidated';end if;
 if jsonb_array_length(public.discovery_links(null,'guide','common'))<1 then raise exception 'reverse editorial link missing';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
update public.jsa_projects set is_public=false where id=current_setting('test.source')::uuid;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$begin
 if (select assessment->>'duplicate_of' from public.public_jsa_catalog where id=current_setting('test.child')::uuid) is not null then raise exception 'private duplicate leak';end if;
 if public.discovery_links(current_setting('test.child')::uuid)->>'source' is not null then raise exception 'private lineage leak';end if;
 if exists(select 1 from jsonb_array_elements(public.discovery_links(null,'guide','common')) l where l->>'id'=current_setting('test.source')) then raise exception 'private editorial leak';end if;
end $$;
reset role;
select 'discovery checks passed' as result;
rollback;
