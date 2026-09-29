alter table public.user_work_steps
  add constraint user_work_steps_source_unique
  unique (user_id, source_project_id, source_step_index);
