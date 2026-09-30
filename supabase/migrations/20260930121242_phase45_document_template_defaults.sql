alter table public.user_layouts add column if not exists is_default boolean not null default false;
create unique index if not exists user_layouts_one_default on public.user_layouts(user_id) where is_default;

create or replace function public.set_default_document_template(p_layout_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 45));
  if p_layout_id is not null and not exists(select 1 from public.user_layouts where id=p_layout_id and user_id=owner_id) then
    raise exception 'TEMPLATE_NOT_FOUND';
  end if;
  update public.user_layouts set is_default=false where user_id=owner_id and is_default;
  if p_layout_id is not null then update public.user_layouts set is_default=true where user_id=owner_id and id=p_layout_id; end if;
end $$;
revoke all on function public.set_default_document_template(uuid) from public, anon;
grant execute on function public.set_default_document_template(uuid) to authenticated;

-- Enforce the structured-field exclusions even if an older client publishes
-- a formerly private row. Free-text titles and risk/control text need review.
create or replace function public.sanitize_public_jsa_snapshot()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.is_public then
    new.form_data = coalesce((select jsonb_object_agg(key,value) from jsonb_each(coalesce(new.form_data,'{}'::jsonb)) where key=any(array['projectName','jsaType','workType','weather','hasNewWorker','ppe','permits'])), '{}'::jsonb);
    new.participants = '[]'::jsonb;
    new.custom_layout = (coalesce(new.custom_layout,'{}'::jsonb) - array['stepPhotos','projectSaveContext','procedures']) || '{"documentNotes":""}'::jsonb;
    new.analysis_data = coalesce((select jsonb_agg((item - array['customFields','sourceProjectId','sourceProjectTitle','sourceStepIndex','proc']) || jsonb_build_object('customFields','{}'::jsonb,'proc',jsonb_build_object('stepTitle',coalesce(item->'proc'->>'stepTitle',''),'stepDetail',coalesce(item->'proc'->>'stepDetail',''))) order by ord) from jsonb_array_elements(coalesce(new.analysis_data,'[]'::jsonb)) with ordinality as steps(item,ord)), '[]'::jsonb);
  end if;
  return new;
end $$;
revoke all on function public.sanitize_public_jsa_snapshot() from public, anon, authenticated;
create trigger phase45_public_snapshot before insert or update of is_public,form_data,participants,custom_layout,analysis_data
on public.jsa_projects for each row execute function public.sanitize_public_jsa_snapshot();
