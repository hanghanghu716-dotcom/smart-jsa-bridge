-- One-time curation of the owner's 12 existing TEST examples, authorized 2026-10-02.
-- Run manually; not a seed or a general migration. No other user's license is changed.
-- Scope: sharing license, risk categories, curated tags, Guide/Case links.
-- TEST labels, work instructions, ratings, privacy settings and document layouts stay intact.
begin;
create temp table example_curation(id uuid primary key,code text,categories text[],tags text[],guide text,case_id text) on commit drop;
insert into example_curation values
('5cb972f5-5273-4e92-a988-ec09690c9a1e','A1',array['작업 준비','고소작업','고소작업','작업 마무리']::text[],array['고소작업(고소작업대)','사고(추락)','사고(낙하)','사고(협착)']::text[],'high-risk','jsa-aerial-lift'),
('78198659-b107-42d1-8599-c2947c9d7c0d','A2',array['작업 준비','전기작업','화기작업','작업 마무리']::text[],array['용접(아크)','사고(화재)','사고(감전)','준비(감시자배치)']::text[],'high-risk','jsa-co2-gmaw'),
('8e9a2310-1774-41a2-b52c-4ca223ad754e','A3',array['작업 준비','양중작업','중량물 작업','해제작업']::text[],array['중량물(인양)','설비(인양용구)','사고(낙하)','사고(협착)']::text[],'high-risk','jsa-crane-operation'),
('cc43f9ae-102e-46f9-bcb0-79fd02bde517','B1',array['라인차단','밀폐공간작업','밀폐공간작업','작업 마무리']::text[],array['밀폐공간(탱크)','준비(가스측정)','준비(감시자배치)','전기정전작업']::text[],'high-risk','jsa-confined-space'),
('9cc48b08-23a9-433f-931a-c58823e9a952','B2',array['작업 준비','전기작업','전기작업','시운전']::text[],array['전기정전작업','전기수배전반','사고(감전)','회전체/말림위험']::text[],'high-risk','jsa-distributionboard-wiring'),
('767b2a36-1424-446f-99da-00ff513fe0bf','B3',array['작업 준비','토목공사','포크레인작업','작업 마무리']::text[],array['굴착(터파기)','굴착(붕괴위험)','사고(매몰)','사고(협착)']::text[],'construction','jsa-excavation-works'),
('28e90655-e02e-46c2-80ca-2864cbf47965','C1',array['작업 준비','중량물 작업','지게차 작업','작업 마무리']::text[],array['중량물(인양)','사고(충돌)','사고(낙하)','사고(협착)']::text[],'manufacturing','jsa-forklift-handling,ko'),
('104048f5-003f-42e9-aa72-e003e80a308d','C2',array['작업 준비','라인차단','배관작업','시운전']::text[],array['준비(가스측정)','고압유체/압력','사고(폭발)','사고(누출)']::text[],'chemical',null),
('81f48904-7abc-4b74-8a9a-1ed7cff5ecf6','C3',array['작업 준비','라인차단','교체작업','시운전']::text[],array['밸브조작','기계분해/조립','고압유체/압력','사고(누출)']::text[],'manufacturing','jsa-pipe-disassembly'),
('46da3036-650b-472d-b8c4-8437d03da612','D1',array['작업 준비','기계설비','기계설비','시운전']::text[],array['기계분해/조립','전기정전작업','회전체/말림위험','사고(협착)']::text[],'manufacturing','jsa-conveyor-maintenance'),
('0da5c9a1-46b1-4361-bdbc-88920dd6c18d','D2',array['환경보건','환경보건','환경보건','폐기물처리']::text[],array['도장/코팅','사고(화재)','준비(환기시설)','보호구(방독마스크)']::text[],'chemical',null),
('d220e5ba-f23c-4476-9915-65dc67b25b34','D3',array['작업 준비','라인차단','철거작업','폐기물처리']::text[],array['철거/해체','사고(낙하)','사고(협착)','사고(붕괴)']::text[],'construction','jsa-construction-waste');
select p.id from public.jsa_projects p join example_curation c using(id) for update of p;
create temp table example_before on commit drop as select p.* from public.jsa_projects p join example_curation c using(id);
do $$ begin
 if (select count(*) from example_before)<>12 then raise exception 'Expected all 12 examples';end if;
 if exists(select 1 from example_before p join example_curation c using(id) where not p.is_public or p.title not like 'TEST_'||c.code||'_%' or jsonb_array_length(p.analysis_data)<>4) then raise exception 'Example changed; inspect before running';end if;
 if exists(select 1 from example_curation c where c.case_id is not null and not exists(select 1 from public.case_studies s where s.post_group_id=c.case_id and s.language_code='ko')) then raise exception 'Missing related article';end if;
end $$;
update public.jsa_projects p set
 analysis_data=(select jsonb_agg(jsonb_set(s.item,'{risks}',(select jsonb_agg(jsonb_set(r.item,'{category}',to_jsonb(c.categories[s.n::int])) order by r.n) from jsonb_array_elements(s.item->'risks') with ordinality r(item,n))) order by s.n) from jsonb_array_elements(p.analysis_data) with ordinality s(item,n)),
 tags=c.tags,auto_tags=c.tags,reuse_license='community-v1',updated_at=clock_timestamp()
from example_curation c where p.id=c.id and (p.reuse_license is distinct from 'community-v1' or p.tags is distinct from c.tags or exists(select 1 from jsonb_array_elements(p.analysis_data) with ordinality s(item,n),lateral jsonb_array_elements(s.item->'risks') r where r->>'category' is distinct from c.categories[s.n::int]));
insert into jsa_private.editorial_links(project_id,kind,target)
 select id,'guide',guide from example_curation
 union all select id,'case',case_id from example_curation where case_id is not null
on conflict do nothing;
do $$ begin
 if exists(select 1 from public.jsa_projects p join example_before b using(id) where p.title is distinct from b.title or p.custom_layout is distinct from b.custom_layout or p.form_data is distinct from b.form_data or p.participants is distinct from b.participants or p.parent_id is distinct from b.parent_id or p.is_public is distinct from b.is_public) then raise exception 'Unexpected document change'; end if;
 if exists(select 1 from public.jsa_projects p join example_before b using(id),lateral jsonb_array_elements(p.analysis_data) with ordinality s(item,n) where s.item-'risks' is distinct from (b.analysis_data->(s.n::int-1))-'risks' or (select jsonb_agg(r-'category') from jsonb_array_elements(s.item->'risks') r) is distinct from (select jsonb_agg(r-'category') from jsonb_array_elements(b.analysis_data->(s.n::int-1)->'risks') r)) then raise exception 'Unexpected analysis change'; end if;
end $$;
select count(*) as curated_examples from public.jsa_projects p join example_curation c using(id) where p.reuse_license='community-v1';
commit;
