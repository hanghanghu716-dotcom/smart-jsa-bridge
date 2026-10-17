-- Keep execution identities/dates and residual assessments private; publish reusable control text only.
create or replace function public.sanitize_public_jsa_snapshot()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare public_assessment jsonb;
begin
  if new.is_public then
    if jsonb_typeof(new.form_data->'assessment')='object' then
      select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into public_assessment
      from jsonb_each(new.form_data->'assessment')
      where key=any(array['frequencyMax','severityMax','highFrom']) and jsonb_typeof(value)='number';
    end if;
    new.form_data = coalesce((select jsonb_object_agg(key,value) from jsonb_each(coalesce(new.form_data,'{}'::jsonb)) where key=any(array['projectName','jsaType','workType','weather','hasNewWorker','ppe','permits'])), '{}'::jsonb);
    if public_assessment is not null then
      new.form_data = new.form_data || jsonb_build_object('assessment',public_assessment);
    end if;
    new.participants = '[]'::jsonb;
    new.custom_layout = (coalesce(new.custom_layout,'{}'::jsonb) - array['stepPhotos','projectSaveContext','procedures']) || '{"documentNotes":""}'::jsonb;
    new.analysis_data = coalesce((select jsonb_agg((item - array['customFields','sourceProjectId','sourceProjectTitle','sourceStepIndex','proc','actionPlan']) || jsonb_build_object('customFields','{}'::jsonb,'proc',jsonb_build_object('stepTitle',coalesce(item->'proc'->>'stepTitle',''),'stepDetail',coalesce(item->'proc'->>'stepDetail',''))) || case when item ? 'actionPlan' then jsonb_build_object('actionPlan',jsonb_build_object('additionalControls',case when jsonb_typeof(item->'actionPlan'->'additionalControls')='string' then item->'actionPlan'->>'additionalControls' else '' end)) else '{}'::jsonb end order by ord) from jsonb_array_elements(coalesce(new.analysis_data,'[]'::jsonb)) with ordinality as steps(item,ord)), '[]'::jsonb);
  end if;
  return new;
end $$;
revoke all on function public.sanitize_public_jsa_snapshot() from public, anon, authenticated;
