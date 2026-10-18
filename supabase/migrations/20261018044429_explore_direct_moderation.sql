-- Reuse the same restrictions as report moderation. No document is deleted.
create function jsa_private.explore_moderation(p_action text,p_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); project public.jsa_projects%rowtype;
 restricted boolean; revision text; reason text; result jsonb;
begin
 if actor is null or not jsa_private.community_admin() then
  raise exception 'ADMIN_REQUIRED' using errcode='42501';
 end if;
 if p_action='restricted' then
  select coalesce(jsonb_agg(to_jsonb(q)),'[]') into result from (
   select p.id,p.title,p.public_locale,p.public_country,p.updated_at
   from public.jsa_projects p join jsa_private.content_restrictions r on r.project_id=p.id
   where r.restricted and p.is_public
    and strpos(lower(coalesce(p.title,'')),lower(left(coalesce(p_payload->>'search',''),200)))>0
   order by p.updated_at desc,p.id
   limit 25 offset greatest(0,least(100000,coalesce((p_payload->>'offset')::int,0)))
  ) q;
  return result;
 end if;
 if p_action is null or p_action not in ('inspect','document','restrict','restore') then raise exception 'INVALID_ACTION'; end if;
 -- Serialize direct moderation with document edits and the existing report workflow.
 select * into project from public.jsa_projects where id=p_id and is_public for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 restricted:=not jsa_private.community_visible(p_id);
 select coalesce(max(id),0)::text into revision from jsa_private.community_audit where project_id=p_id;
 result:=jsonb_build_object('id',p_id,'title',project.title,'restricted',restricted,'version',revision,'updated_at',project.updated_at);
 if p_action='inspect' then return result; end if;
 if p_action='document' then
  return result||jsonb_build_object('document',jsonb_build_object(
   'id',p_id,'title',project.title,'author_id',project.author_id,'is_public',true,
   'public_locale',project.public_locale,'public_country',project.public_country,
   'form_data',project.form_data,'analysis_data',project.analysis_data,'custom_layout',project.custom_layout,
   'tags',project.tags,'created_at',project.created_at,'updated_at',project.updated_at,
   'published_at',project.published_at,'content_updated_at',project.content_updated_at,
   'reuse_license',project.reuse_license,'publication_context',project.publication_context,
   'license_accepted_at',project.license_accepted_at,'document_group_id',project.document_group_id,
   'document_variant',project.document_variant,
   'is_operator',exists(select 1 from public.operator_accounts where user_id=project.author_id)));
 end if;
 reason:=btrim(p_payload->>'reason');
 if reason is null or length(reason)<10 or length(reason)>2000 then raise exception 'INVALID_REASON'; end if;
 if p_payload->>'version' is distinct from revision
  or (p_payload->>'updated_at')::timestamptz is distinct from project.updated_at
  or (p_action='restrict' and restricted) or (p_action='restore' and not restricted)
 then raise exception 'STALE_MODERATION'; end if;
 insert into jsa_private.content_restrictions(project_id,restricted) values(p_id,p_action='restrict')
 on conflict(project_id) do update set restricted=excluded.restricted;
 insert into jsa_private.community_audit(actor,project_id,action,reason) values(actor,p_id,p_action,reason);
 -- Use the existing in-app decision notice; no email is sent.
 insert into public.community_notices(user_id,project_id,action,reason) values(project.author_id,p_id,p_action,reason);
 return jsonb_build_object('id',p_id,'restricted',p_action='restrict');
end;
$$;
revoke all on function jsa_private.explore_moderation(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function jsa_private.explore_moderation(text,uuid,jsonb) to authenticated;
create function public.explore_moderation(p_action text,p_id uuid default null,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$
 select jsa_private.explore_moderation(p_action,p_id,p_payload)
$$;
revoke all on function public.explore_moderation(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.explore_moderation(text,uuid,jsonb) to authenticated;
