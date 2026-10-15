-- Prepared only; the publication coordinator applies this under its release lock.
-- Preserve all existing countries and NULL semantics. No project rows are rewritten.
-- Abort rather than overwrite an unexpected current constraint.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
lock table public.jsa_projects in access exclusive mode;

-- Let this PostgreSQL version deparse the expected definition instead of relying
-- on whitespace or cast formatting from another server/version.
create temporary table ro_country_constraint_expected (
  public_country text,
  constraint ro_country_expected check (public_country in
    ('KR','US','CA','GB','AU','SG','DE','JP','FR','IT','ES','SA','BR','RU'))
) on commit drop;

do $preflight$
declare
  actual_definition text;
  expected_definition text;
  is_validated boolean;
begin
  select pg_get_constraintdef(oid), convalidated
    into actual_definition, is_validated
    from pg_constraint
    where conrelid = 'public.jsa_projects'::regclass
      and conname = 'jsa_projects_public_country_check' and contype = 'c';
  select pg_get_constraintdef(oid) into expected_definition
    from pg_constraint
    where conrelid = 'pg_temp.ro_country_constraint_expected'::regclass
      and conname = 'ro_country_expected';
  if actual_definition is distinct from expected_definition
     or is_validated is distinct from true then
    raise exception 'RO country preflight failed: current constraint differs from the reviewed 14-country definition';
  end if;
end
$preflight$;

alter table public.jsa_projects
  drop constraint jsa_projects_public_country_check,
  add constraint jsa_projects_public_country_check check (public_country in
    ('KR','US','CA','GB','AU','SG','DE','JP','FR','IT','ES','SA','BR','RU','RO'));

alter table ro_country_constraint_expected
  drop constraint ro_country_expected,
  add constraint ro_country_expected check (public_country in
    ('KR','US','CA','GB','AU','SG','DE','JP','FR','IT','ES','SA','BR','RU','RO'));

do $postflight$
begin
  if not exists (
    select 1 from pg_constraint actual cross join pg_constraint expected
    where actual.conrelid = 'public.jsa_projects'::regclass
      and actual.conname = 'jsa_projects_public_country_check'
      and actual.contype = 'c' and actual.convalidated
      and expected.conrelid = 'pg_temp.ro_country_constraint_expected'::regclass
      and expected.conname = 'ro_country_expected'
      and pg_get_constraintdef(actual.oid) = pg_get_constraintdef(expected.oid)
  ) then
    raise exception 'RO country postflight failed: validated 15-country constraint was not found';
  end if;
end
$postflight$;

-- Preserve the live private function definition and ACL; change only the single
-- reviewed country allowlist. The public wrapper and visibility checks stay intact.
do $function_patch$
declare
  target regprocedure := to_regprocedure('jsa_private.editorial_jsa_by_country(text,text,text)');
  before_definition text;
  after_definition text;
  before_metadata jsonb;
  after_metadata jsonb;
  old_guard text := $old$country not in ('KR','US','CA','GB','AU','SG','DE','JP','FR','IT','ES','SA','BR','RU')$old$;
  new_guard text := $new$country not in ('KR','US','CA','GB','AU','SG','DE','JP','FR','IT','ES','SA','BR','RU','RO')$new$;
begin
  if target is null then
    raise exception 'RO function preflight failed: expected private function is absent';
  end if;
  select pg_get_functiondef(target) into before_definition;
  if (length(before_definition) - length(replace(before_definition, old_guard, ''))) <> length(old_guard) then
    raise exception 'RO function preflight failed: expected country guard does not occur exactly once';
  end if;
  select jsonb_build_object('owner',proowner,'acl',proacl,'security_definer',prosecdef,
    'config',proconfig,'volatility',provolatile,'arguments',proargnames)
    into before_metadata from pg_proc where oid=target;
  execute replace(before_definition, old_guard, new_guard);
  select pg_get_functiondef(target) into after_definition;
  select jsonb_build_object('owner',proowner,'acl',proacl,'security_definer',prosecdef,
    'config',proconfig,'volatility',provolatile,'arguments',proargnames)
    into after_metadata from pg_proc where oid=target;
  if after_definition is distinct from replace(before_definition, old_guard, new_guard)
    or after_metadata is distinct from before_metadata then
    raise exception 'RO function postflight failed: unexpected definition, owner, ACL or configuration change';
  end if;
end
$function_patch$;
notify pgrst, 'reload schema';

commit;

-- Capture this result in the coordinator's publication evidence.
select conname, convalidated, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.jsa_projects'::regclass
  and conname = 'jsa_projects_public_country_check';

select pg_get_functiondef('jsa_private.editorial_jsa_by_country(text,text,text)'::regprocedure) as definition;
