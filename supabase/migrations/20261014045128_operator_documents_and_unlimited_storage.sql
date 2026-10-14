create table public.operator_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.operator_accounts enable row level security;
revoke all on public.operator_accounts from public,anon,authenticated;
grant select on public.operator_accounts to anon,authenticated;
grant all on public.operator_accounts to service_role;
create policy operator_accounts_public_read on public.operator_accounts for select to anon,authenticated using (true);
-- Register the designated operator through a privileged operation before the next migration.
-- Production registration was applied with this migration.
alter table public.jsa_projects add column document_group_id uuid, add column document_variant text check(document_variant in ('basic','technical','handover'));
create index jsa_projects_document_group_idx on public.jsa_projects(document_group_id,author_id) where document_group_id is not null;
create or replace view public.public_jsa_catalog with (security_invoker=true) as SELECT p.id,
    p.title,
    p.author_id,
    p.is_public,
    p.public_locale,
    p.form_data,
    p.analysis_data,
    p.custom_layout,
    p.tags,
    p.created_at,
    p.updated_at,
    p.scrap_count,
    COALESCE(m.view_count, (0)::bigint) AS view_count,
    COALESCE(m.reuse_count, (0)::bigint) AS reuse_count,
    p.reuse_license,
    p.publication_context,
    p.license_accepted_at,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM jsa_projects source
              WHERE ((source.id = p.parent_id) AND source.is_public AND jsa_private.community_visible(source.id)))) THEN p.parent_id
            ELSE NULL::uuid
        END AS parent_id,
    ( SELECT count(*) AS count
           FROM jsa_projects child
          WHERE ((child.parent_id = p.id) AND child.is_public AND jsa_private.community_visible(child.id))) AS fork_count,
    jsa_private.publication_assessment(p.id) AS assessment,
    p.public_country,
    p.published_at,
    p.content_updated_at,
    EXISTS (SELECT 1 FROM public.operator_accounts oa WHERE oa.user_id=p.author_id) AS is_operator,
    p.document_group_id,
    p.document_variant
   FROM (jsa_projects p
     LEFT JOIN public_jsa_metrics m ON ((m.project_id = p.id)))
  WHERE (p.is_public AND jsa_private.community_visible(p.id));
CREATE OR REPLACE FUNCTION jsa_private.enforce_project_storage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare owner_id uuid; delta integer:=0; unlimited boolean;
begin
 if tg_op='INSERT' then owner_id=new.author_id; delta=case when new.is_public is true then 0 else 1 end;
 elsif tg_op='DELETE' then owner_id=old.author_id; delta=case when old.is_public is true then 0 else -1 end;
 else owner_id=new.author_id; delta=(case when new.is_public is true then 0 else 1 end)-(case when old.is_public is true then 0 else 1 end);
 end if;
 if delta=0 then return null; end if;
 if auth.uid() is not null and owner_id is distinct from auth.uid() then raise exception 'PROJECT_OWNER_INVALID'; end if;
 if delta<0 then
  update jsa_private.project_storage_usage set private_count=private_count-1 where user_id=owner_id;
 else
  insert into jsa_private.project_storage_usage(user_id) values(owner_id) on conflict(user_id) do nothing;
  perform 1 from jsa_private.project_storage_usage where user_id=owner_id for update;
  unlimited=auth.uid() is null or exists(select 1 from public.operator_accounts where user_id=owner_id) or exists(select 1 from public.jsa_beta_access where user_id=owner_id and expires_at>clock_timestamp());
  update jsa_private.project_storage_usage set private_count=private_count+1
   where user_id=owner_id and (unlimited or private_count<3);
  if not found then raise exception using message='FREE_PROJECT_LIMIT',errcode='P0001'; end if;
 end if;
 return null;
end $function$;

CREATE OR REPLACE FUNCTION jsa_private.read_project_storage()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); used bigint; expiry timestamptz; unlimited boolean; operator_account boolean;
begin
 if actor is null then raise exception 'AUTH_REQUIRED'; end if;
 select coalesce(private_count,0) into used from jsa_private.project_storage_usage where user_id=actor;
 select expires_at into expiry from public.jsa_beta_access where user_id=actor;
 operator_account=exists(select 1 from public.operator_accounts where user_id=actor);
 unlimited=operator_account or coalesce(expiry>clock_timestamp(),false);
 return jsonb_build_object('used',coalesce(used,0),'limit',case when unlimited then null else 3 end,'is_operator',operator_account,'unlimited',unlimited,'trial_active',coalesce(expiry>clock_timestamp(),false),'trial_expires_at',expiry,'can_create',unlimited or coalesce(used,0)<3,'community_free',not unlimited);
end $function$;

create table jsa_private.operator_seed_backup (
 project_id uuid primary key,
 snapshot jsonb not null,
 backed_up_at timestamptz not null default now()
);
alter table jsa_private.operator_seed_backup enable row level security;
revoke all on jsa_private.operator_seed_backup from public,anon,authenticated;
