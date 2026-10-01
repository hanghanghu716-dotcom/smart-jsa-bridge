create or replace function jsa_private.fingerprint_publication() returns trigger language plpgsql security definer set search_path='' as $$
declare b text;
begin
 if not new.is_public then delete from jsa_private.publication_fingerprints where project_id=new.id; return new; end if;
 b:=jsa_private.publication_body(new.analysis_data);
 insert into jsa_private.publication_fingerprints values(new.id,b,md5(b),md5(jsonb_build_array(new.title,new.public_locale,new.analysis_data,new.tags,new.publication_context,new.reuse_license,new.form_data,new.custom_layout)::text))
 on conflict(project_id) do update set body=excluded.body,body_hash=excluded.body_hash,revision_hash=excluded.revision_hash;
 return new;
end $$;
drop trigger publication_fingerprint on public.jsa_projects;
create trigger publication_fingerprint after insert or update of is_public,title,public_locale,analysis_data,tags,publication_context,reuse_license,form_data,custom_layout on public.jsa_projects for each row execute function jsa_private.fingerprint_publication();
update jsa_private.publication_fingerprints f set revision_hash=md5(jsonb_build_array(p.title,p.public_locale,p.analysis_data,p.tags,p.publication_context,p.reuse_license,p.form_data,p.custom_layout)::text) from public.jsa_projects p where p.id=f.project_id;
-- UTC month definitions for queries scanning a year of events and lineage.
create index if not exists discovery_event_day_idx on jsa_metrics_private.events(event_day,project_id) include(actor,step_index);
create index if not exists discovery_public_parent_idx on public.jsa_projects(parent_id,created_at,id) where is_public;
notify pgrst,'reload schema';
