-- Read-only projection of the already-public, moderation-filtered catalog.
-- No document rows, permissions on private tables, or publication rules change.
create or replace function public.public_index_text(value jsonb) returns text
language sql immutable parallel safe set search_path='' as $$
 select case when jsonb_typeof(value)='string' then btrim(value #>> '{}',
 U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') else '' end
$$;
create or replace function public.public_index_length(value text) returns integer
language sql immutable parallel safe set search_path='' as $$
 -- JS String.length counts supplementary Unicode characters as two units.
 select char_length(regexp_replace(coalesce(value,''),U&'[\+010000-\+10FFFF]','xx','g'))
$$;
create or replace function public.publication_index_facts(value jsonb) returns jsonb
language sql immutable parallel safe set search_path='' as $$
 with steps as (
 select step,public.public_index_text(step->'proc'->'stepTitle') title,
 public.public_index_text(step->'proc'->'stepDetail') detail
 from jsonb_array_elements(case when jsonb_typeof(value)='array' then value else '[]'::jsonb end) s(step)
 ), complete as (
 select * from steps where title<>'' and detail<>'' and exists (
 select 1 from jsonb_array_elements(case when jsonb_typeof(step->'risks')='array' then step->'risks' else '[]'::jsonb end) r
 where public.public_index_text(r->'factor')<>'' and (
 public.public_index_text(r->'measure')<>'' or public.public_index_text(r->'current_measure')<>'' or public.public_index_text(r->'recommend_measure')<>''))
 )
 select jsonb_build_object('titles',coalesce(jsonb_agg(title),'[]'::jsonb),'meaningful',coalesce(sum(
 public.public_index_length(detail) + (select coalesce(sum(public.public_index_length(public.public_index_text(r->field))),0)
 from jsonb_array_elements(step->'risks') r cross join unnest(array['factor','measure','current_measure','recommend_measure']) field)),0)) from complete
$$;
revoke all on function public.public_index_text(jsonb),public.public_index_length(text),public.publication_index_facts(jsonb) from public;
grant execute on function public.public_index_text(jsonb),public.public_index_length(text),public.publication_index_facts(jsonb) to anon,authenticated,service_role;
create view public.public_jsa_index with (security_invoker=true,security_barrier=true) as
 select id,title,is_public,public_locale,public_country,reuse_license,assessment,published_at,content_updated_at,
 public.publication_index_facts(analysis_data) as index_facts
 from public.public_jsa_catalog;
revoke all on public.public_jsa_index from public,anon,authenticated;
grant select on public.public_jsa_index to anon,authenticated,service_role;
comment on view public.public_jsa_index is 'Minimal discovery metadata; inherits all public catalog visibility rules. Never contains document bodies or private fields.';
