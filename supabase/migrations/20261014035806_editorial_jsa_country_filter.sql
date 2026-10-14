-- Editorial links are shared across translations of a case/guide.
-- Apply the page country BEFORE the limit, without removing source relationships.
create function jsa_private.editorial_jsa_by_country(lk text,lt text,country text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if lk is null or lk not in ('case','guide') or lt is null or length(lt) not between 1 and 300
  or country is null or country not in ('KR','US','CA','GB','AU','SG','DE','JP','FR','IT','ES','SA','BR','RU') then
  return '[]'::jsonb;
 end if;
 -- Intentionally public: only currently visible PUBLIC documents may be returned.
 -- The private helper can read editorial links but cannot expose private documents.
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'locale',p.public_locale,'country',p.public_country) order by p.updated_at desc,p.id)
  from (select p1.id,p1.title,p1.public_locale,p1.public_country,p1.updated_at
   from public.jsa_projects p1
   where p1.is_public and p1.public_country=country and jsa_private.community_visible(p1.id)
    and exists(select 1 from jsa_private.editorial_links e where e.project_id=p1.id and e.kind=lk and e.target=lt)
   order by p1.updated_at desc,p1.id limit 12) p),'[]'::jsonb);
end $$;
revoke all on function jsa_private.editorial_jsa_by_country(text,text,text) from public,anon,authenticated;
grant execute on function jsa_private.editorial_jsa_by_country(text,text,text) to anon,authenticated;
create function public.editorial_jsa_by_country(p_kind text,p_target text,p_country text)
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsa_private.editorial_jsa_by_country(p_kind,p_target,p_country);
$$;
revoke all on function public.editorial_jsa_by_country(text,text,text) from public,anon,authenticated;
grant execute on function public.editorial_jsa_by_country(text,text,text) to anon,authenticated;
notify pgrst,'reload schema';
