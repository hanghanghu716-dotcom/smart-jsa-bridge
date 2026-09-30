-- Pre-registration beta: no payment provider, card details, invoices or automatic billing.
create table public.jsa_beta_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '30 days',
 interest_plan text not null default 'business' check(interest_plan in('pro','business'))
);
create table public.jsa_organizations (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null check(length(btrim(name)) between 1 and 120), created_at timestamptz not null default now()
);
create table public.jsa_org_members (
 org_id uuid not null references public.jsa_organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in('owner','editor','reviewer','viewer')), created_at timestamptz not null default now(),
 primary key(org_id,user_id)
);
create table public.jsa_org_invites (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.jsa_organizations(id) on delete cascade,
 token_hash text not null unique, role text not null check(role in('editor','reviewer','viewer')),
 expires_at timestamptz not null default now()+interval '7 days', revoked boolean not null default false,
 accepted_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.jsa_org_templates (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.jsa_organizations(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 120), layout_data jsonb not null,
 version integer not null default 1, updated_at timestamptz not null default now(), updated_by uuid not null references auth.users(id)
);
create table public.jsa_org_documents (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.jsa_organizations(id) on delete cascade,
 title text not null, snapshot jsonb not null, state text not null default 'draft' check(state in('draft','submitted','approved','rejected')),
 version integer not null default 1, edited_by uuid not null references auth.users(id),
 reviewer_id uuid references auth.users(id), submitted_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
create table public.jsa_org_revisions (
 id bigint generated always as identity primary key, org_id uuid not null references public.jsa_organizations(id) on delete cascade,
 document_id uuid not null references public.jsa_org_documents(id) on delete cascade, version integer not null,
 title text not null, snapshot jsonb not null, state text not null, action text not null,
 actor_id uuid not null references auth.users(id), reviewer_id uuid references auth.users(id), comment text not null default '',
 created_at timestamptz not null default now(), unique(document_id,version)
);
create table public.jsa_project_revisions (
 id bigint generated always as identity primary key, project_id uuid not null references public.jsa_projects(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, snapshot jsonb not null, created_at timestamptz not null default now()
);
create index jsa_members_user on public.jsa_org_members(user_id,org_id);
create index jsa_invites_org on public.jsa_org_invites(org_id);
create index jsa_templates_org on public.jsa_org_templates(org_id);
create index jsa_documents_org on public.jsa_org_documents(org_id,updated_at desc);
create index jsa_revisions_org on public.jsa_org_revisions(org_id,document_id,version desc);
create index jsa_project_revisions_owner on public.jsa_project_revisions(user_id,project_id,id desc);

-- Private helpers avoid recursive membership RLS. Every helper is scoped to auth.uid().
grant usage on schema jsa_private to authenticated;
create function jsa_private.org_role(p_org uuid) returns text language sql stable security definer set search_path='' as $$
 select role from public.jsa_org_members where org_id=p_org and user_id=auth.uid()
$$;
create function jsa_private.beta_active(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.jsa_beta_access where user_id=p_user and expires_at>now())
$$;
revoke all on function jsa_private.org_role(uuid), jsa_private.beta_active(uuid) from public,anon,authenticated;
grant execute on function jsa_private.org_role(uuid) to authenticated;

alter table public.jsa_beta_access enable row level security;
alter table public.jsa_organizations enable row level security;
alter table public.jsa_org_members enable row level security;
alter table public.jsa_org_invites enable row level security;
alter table public.jsa_org_templates enable row level security;
alter table public.jsa_org_documents enable row level security;
alter table public.jsa_org_revisions enable row level security;
alter table public.jsa_project_revisions enable row level security;
revoke all on public.jsa_beta_access,public.jsa_organizations,public.jsa_org_members,public.jsa_org_invites,public.jsa_org_templates,public.jsa_org_documents,public.jsa_org_revisions,public.jsa_project_revisions from anon,authenticated;
grant select on public.jsa_beta_access,public.jsa_organizations,public.jsa_org_members,public.jsa_org_invites,public.jsa_org_templates,public.jsa_org_documents,public.jsa_org_revisions,public.jsa_project_revisions to authenticated;
create policy beta_read on public.jsa_beta_access for select to authenticated using(user_id=(select auth.uid()));
create policy org_read on public.jsa_organizations for select to authenticated using(jsa_private.org_role(id) is not null);
create policy member_read on public.jsa_org_members for select to authenticated using(jsa_private.org_role(org_id) is not null);
create policy invite_read on public.jsa_org_invites for select to authenticated using(jsa_private.org_role(org_id)='owner');
create policy template_read on public.jsa_org_templates for select to authenticated using(jsa_private.org_role(org_id) is not null);
create policy document_read on public.jsa_org_documents for select to authenticated using(jsa_private.org_role(org_id) is not null);
create policy revision_read on public.jsa_org_revisions for select to authenticated using(jsa_private.org_role(org_id) is not null);
create policy personal_revision_read on public.jsa_project_revisions for select to authenticated using(user_id=(select auth.uid()));

create function jsa_private.capture_project_revision() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not new.is_public and new.author_id=auth.uid() and jsa_private.beta_active(auth.uid()) then
  if tg_op='UPDATE' and not old.is_public and not exists(select 1 from public.jsa_project_revisions where project_id=new.id) then
   insert into public.jsa_project_revisions(project_id,user_id,snapshot) values(old.id,old.author_id,to_jsonb(old));
  end if;
  insert into public.jsa_project_revisions(project_id,user_id,snapshot) values(new.id,new.author_id,to_jsonb(new));
 end if;
 return null;
end $$;
revoke all on function jsa_private.capture_project_revision() from public,anon,authenticated;
create trigger phase6_project_revisions after insert or update of form_data,analysis_data,participants,custom_layout,title on public.jsa_projects
for each row execute function jsa_private.capture_project_revision();

-- The only write surface. Definer execution is needed for atomic organization
-- creation, hashed invite redemption, immutable history and role-checked transitions.
-- Tables grant no client writes. Every branch authenticates and checks its target.
create function jsa_private.business_dispatch(p_action text,p_org uuid,p_doc uuid,p_expected integer,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); role_name text; org public.jsa_organizations; doc public.jsa_org_documents;
 invitation public.jsa_org_invites; project public.jsa_projects; revision public.jsa_project_revisions;
 token text; result jsonb; new_id uuid; target uuid; chosen_role text; snap jsonb; note text:=left(coalesce(p_payload->>'comment',''),2000);
begin
 if actor is null then raise exception 'AUTH_REQUIRED'; end if;
 if jsonb_typeof(p_payload)<>'object' then raise exception 'INVALID_INPUT'; end if;
 if p_action='start_beta' then
  if coalesce(p_payload->>'plan','business') not in('pro','business') then raise exception 'INVALID_INPUT'; end if;
  insert into public.jsa_beta_access(user_id,interest_plan) values(actor,coalesce(p_payload->>'plan','business')) on conflict(user_id) do nothing;
  select to_jsonb(b) into result from public.jsa_beta_access b where user_id=actor; return result;
 elsif p_action='interest' then
  if p_payload->>'plan' not in('pro','business') then raise exception 'INVALID_INPUT'; end if;
  update public.jsa_beta_access set interest_plan=p_payload->>'plan' where user_id=actor;
  return '{}'::jsonb;
 elsif p_action='create_org' then
  if not jsa_private.beta_active(actor) then raise exception 'BETA_REQUIRED'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,60));
  if (select count(*) from public.jsa_organizations where owner_id=actor)>=3 then raise exception 'ORG_LIMIT'; end if;
  insert into public.jsa_organizations(owner_id,name) values(actor,btrim(p_payload->>'name')) returning * into org;
  insert into public.jsa_org_members(org_id,user_id,role) values(org.id,actor,'owner'); return to_jsonb(org);
 elsif p_action='restore_personal' then
  if not jsa_private.beta_active(actor) then raise exception 'BETA_REQUIRED'; end if;
  select * into project from public.jsa_projects where id=p_doc and author_id=actor and user_id=actor and not is_public for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if project.updated_at is distinct from (p_payload->>'updatedAt')::timestamptz then raise exception 'VERSION_CONFLICT'; end if;
  select * into revision from public.jsa_project_revisions where id=(p_payload->>'revision')::bigint and project_id=p_doc and user_id=actor;
  if not found then raise exception 'NOT_FOUND'; end if;
  snap=revision.snapshot;
  update public.jsa_projects set title=snap->>'title',project_name=snap->>'project_name',form_data=snap->'form_data',analysis_data=snap->'analysis_data',participants=snap->'participants',custom_layout=snap->'custom_layout',updated_at=clock_timestamp() where id=p_doc returning * into project;
  return to_jsonb(project);
 elsif p_action='join' then
  -- Discover the organization from a high-entropy token, then lock in the same
  -- organization-first order as revocation and membership updates.
  select * into invitation from public.jsa_org_invites where token_hash=encode(sha256(convert_to(coalesce(p_payload->>'token',''),'UTF8')),'hex');
  if not found then raise exception 'INVITE_UNAVAILABLE'; end if;
  p_org=invitation.org_id;
 end if;

 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_org::text,61));
 select * into org from public.jsa_organizations where id=p_org;
 if not found then raise exception 'NOT_FOUND'; end if;
 if p_action='join' then
  select * into invitation from public.jsa_org_invites where id=invitation.id for update;
  if invitation.revoked or invitation.accepted_by is not null or invitation.expires_at<=now() or not jsa_private.beta_active(org.owner_id) then raise exception 'INVITE_UNAVAILABLE'; end if;
  if exists(select 1 from public.jsa_org_members where org_id=p_org and user_id=actor) then raise exception 'ALREADY_MEMBER'; end if;
  insert into public.jsa_org_members(org_id,user_id,role) values(p_org,actor,invitation.role);
  update public.jsa_org_invites set accepted_by=actor where id=invitation.id;
  return jsonb_build_object('org_id',p_org);
 end if;
 role_name=jsa_private.org_role(p_org);
 if role_name is null then raise exception 'ACCESS_DENIED'; end if;
 if p_action='org_status' then
  select jsonb_build_object('role',role_name,'expires_at',expires_at,'active',expires_at>now()) into result from public.jsa_beta_access where user_id=org.owner_id;
  return coalesce(result,jsonb_build_object('role',role_name,'active',false));
 end if;
 if p_action='member_role' or p_action='remove_member' then
  if role_name<>'owner' then raise exception 'ACCESS_DENIED'; end if;
  target=(p_payload->>'user_id')::uuid;
  if target=org.owner_id then raise exception 'OWNER_PROTECTED'; end if;
  if p_action='remove_member' then delete from public.jsa_org_members where org_id=p_org and user_id=target;
  else
   chosen_role=p_payload->>'role';
   if chosen_role not in('editor','reviewer','viewer') then raise exception 'INVALID_INPUT'; end if;
   update public.jsa_org_members set role=chosen_role where org_id=p_org and user_id=target;
  end if; return '{}'::jsonb;
 elsif p_action='revoke_invite' then
  if role_name<>'owner' then raise exception 'ACCESS_DENIED'; end if;
  update public.jsa_org_invites set revoked=true where org_id=p_org and id=p_doc; return '{}'::jsonb;
 elsif p_action='leave' then
  if role_name='owner' then raise exception 'OWNER_PROTECTED'; end if;
  delete from public.jsa_org_members where org_id=p_org and user_id=actor; return '{}'::jsonb;
 end if;
 if not jsa_private.beta_active(org.owner_id) then raise exception 'BETA_EXPIRED'; end if;
 if p_action='invite' then
  if role_name<>'owner' then raise exception 'ACCESS_DENIED'; end if;
  chosen_role=p_payload->>'role';
  if chosen_role not in('editor','reviewer','viewer') then raise exception 'INVALID_INPUT'; end if;
  token=gen_random_uuid()::text||gen_random_uuid()::text;
  insert into public.jsa_org_invites(org_id,token_hash,role) values(p_org,encode(sha256(convert_to(token,'UTF8')),'hex'),chosen_role) returning id into new_id;
  return jsonb_build_object('id',new_id,'token',token);
 elsif p_action='save_template' then
  if role_name not in('owner','editor') then raise exception 'ACCESS_DENIED'; end if;
  if jsonb_typeof(p_payload->'layout')<>'object' then raise exception 'INVALID_INPUT'; end if;
  select coalesce(jsonb_object_agg(key,value),'{}') into snap from jsonb_each(p_payload->'layout') where key=any(array['documentBlocks','savedActiveOrder','savedUserColumns','savedColumnOverrides','savedOrientation','savedSignatureRows','docTitle','appr1','appr2','appr3','documentNotes','isModuleSkipped']);
  if p_doc is null then insert into public.jsa_org_templates(org_id,name,layout_data,updated_by) values(p_org,btrim(p_payload->>'name'),snap,actor) returning id into new_id;
  else update public.jsa_org_templates set name=btrim(p_payload->>'name'),layout_data=snap,version=version+1,updated_by=actor,updated_at=clock_timestamp() where id=p_doc and org_id=p_org and version=p_expected returning id into new_id;
   if not found then raise exception 'VERSION_CONFLICT'; end if;
  end if;
  return jsonb_build_object('id',new_id);
 elsif p_action='delete_template' then
  if role_name not in('owner','editor') then raise exception 'ACCESS_DENIED'; end if;
  delete from public.jsa_org_templates where id=p_doc and org_id=p_org and version=p_expected;
  if not found then raise exception 'VERSION_CONFLICT'; end if; return '{}'::jsonb;
 end if;

 if p_doc is not null then
  select * into doc from public.jsa_org_documents where id=p_doc and org_id=p_org for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if doc.version is distinct from p_expected then raise exception 'VERSION_CONFLICT'; end if;
 end if;
 if p_action='import_document' then
  if role_name not in('owner','editor') then raise exception 'ACCESS_DENIED'; end if;
  if p_doc is not null and doc.state not in('draft','rejected') then raise exception 'DOCUMENT_LOCKED'; end if;
  select * into project from public.jsa_projects where id=(p_payload->>'project_id')::uuid and author_id=actor and user_id=actor and not is_public;
  if not found then raise exception 'PRIVATE_SOURCE_REQUIRED'; end if;
  snap=jsonb_build_object('form_data',project.form_data,'participants',project.participants,'analysis_data',project.analysis_data,'custom_layout',project.custom_layout-array['projectSaveContext'],'title',project.title);
  if p_doc is null then
   insert into public.jsa_org_documents(org_id,title,snapshot,edited_by) values(p_org,coalesce(project.title,''),snap,actor) returning * into doc;
  else
   update public.jsa_org_documents set title=coalesce(project.title,''),snapshot=snap,state='draft',edited_by=actor,reviewer_id=null,submitted_by=null,version=version+1,updated_at=clock_timestamp() where id=p_doc returning * into doc;
  end if;
 elsif p_action in('submit','approve','reject','reopen','withdraw','restore_revision') then
  if p_doc is null then raise exception 'NOT_FOUND'; end if;
  if p_action in('approve','reject') then
   if role_name not in('owner','reviewer') or doc.reviewer_id is distinct from actor or doc.submitted_by=actor or doc.edited_by=actor then raise exception 'ACCESS_DENIED'; end if;
   if doc.state<>'submitted' then raise exception 'DOCUMENT_LOCKED'; end if;
   if p_action='reject' and length(btrim(note))=0 then raise exception 'COMMENT_REQUIRED'; end if;
   doc.state=case when p_action='approve' then 'approved' else 'rejected' end;
  else
   if role_name not in('owner','editor') then raise exception 'ACCESS_DENIED'; end if;
   if p_action='submit' then
    if doc.state<>'draft' then raise exception 'DOCUMENT_LOCKED'; end if;
    target=(p_payload->>'reviewer_id')::uuid;
    if target=actor or target=doc.edited_by or not exists(select 1 from public.jsa_org_members where org_id=p_org and user_id=target and role in('owner','reviewer')) then raise exception 'REVIEWER_REQUIRED'; end if;
    doc.state='submitted';doc.reviewer_id=target;doc.submitted_by=actor;
   else
    if p_action='withdraw' then
     if doc.state<>'submitted' or (role_name<>'owner' and doc.submitted_by<>actor) then raise exception 'ACCESS_DENIED'; end if;
    elsif doc.state='submitted' then raise exception 'DOCUMENT_LOCKED'; end if;
    if p_action='restore_revision' then
     select r.snapshot,r.title into snap,token from public.jsa_org_revisions r where r.id=(p_payload->>'revision')::bigint and r.document_id=p_doc and r.org_id=p_org;
     if not found then raise exception 'NOT_FOUND'; end if;
     doc.snapshot=snap;doc.title=token;
    end if;
    doc.state='draft';doc.reviewer_id=null;doc.submitted_by=null;doc.edited_by=actor;
   end if;
  end if;
  update public.jsa_org_documents set title=doc.title,snapshot=doc.snapshot,state=doc.state,edited_by=doc.edited_by,reviewer_id=doc.reviewer_id,submitted_by=doc.submitted_by,version=version+1,updated_at=clock_timestamp() where id=p_doc returning * into doc;
 else raise exception 'UNKNOWN_ACTION'; end if;
 insert into public.jsa_org_revisions(org_id,document_id,version,title,snapshot,state,action,actor_id,reviewer_id,comment) values(p_org,doc.id,doc.version,doc.title,doc.snapshot,doc.state,p_action,actor,doc.reviewer_id,note);
 return to_jsonb(doc);
end $$;
revoke all on function jsa_private.business_dispatch(text,uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function jsa_private.business_dispatch(text,uuid,uuid,integer,jsonb) to authenticated;
create function public.jsa_business_action(p_action text,p_org uuid default null,p_doc uuid default null,p_expected integer default null,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$
 select jsa_private.business_dispatch(p_action,p_org,p_doc,p_expected,p_payload)
$$;
revoke all on function public.jsa_business_action(text,uuid,uuid,integer,jsonb) from public,anon;
grant execute on function public.jsa_business_action(text,uuid,uuid,integer,jsonb) to authenticated;
