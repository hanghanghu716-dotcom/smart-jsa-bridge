// Isolated PostgreSQL acceptance: no production rows or counters are touched.
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();await db.waitReady;
 const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema jsa_private;create schema jsa_metrics_private;
   grant usage on schema auth,jsa_private,jsa_metrics_private to anon,authenticated;
   create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function jsa_private.community_visible(uuid) returns boolean language sql as $$select true$$;
   create function jsa_private.publication_assessment(uuid) returns jsonb language sql as $$select '{}'::jsonb$$;
   create table public.jsa_projects(id uuid primary key,title text,author_id uuid,is_public boolean,public_locale text,form_data jsonb,analysis_data jsonb,custom_layout jsonb,tags text[],created_at timestamptz,updated_at timestamptz,scrap_count bigint,reuse_license text,publication_context jsonb,license_accepted_at timestamptz,parent_id uuid);
   create table public.public_jsa_metrics(project_id uuid,view_count bigint,reuse_count bigint);
   create table public.case_studies(id uuid primary key,title text);
   alter table public.jsa_projects enable row level security;create policy project_public on public.jsa_projects for select using(is_public);
   alter table public.case_studies enable row level security;create policy cases_public on public.case_studies for select using(true);
   grant select on public.jsa_projects,public.case_studies,public.public_jsa_metrics to anon,authenticated;
   insert into public.jsa_projects(id,title,is_public,public_locale) values('${id(1)}','KR',true,'ko'),('${id(2)}','Private',false,'ko'),('${id(3)}','US',true,'en-US');
   insert into public.case_studies values('${id(10)}','Case'),('${id(11)}','Other language');`);
  await db.exec(fs.readFileSync('supabase/migrations/20261008035606_explore_country_case_views.sql','utf8'));
  assert.equal((await db.query(`select public_country from public.jsa_projects where id='${id(1)}'`)).rows[0].public_country,'KR');
  assert.equal((await db.query(`select public_country from public.jsa_projects where id='${id(2)}'`)).rows[0].public_country,null);
  await db.exec('grant select on public.public_jsa_catalog to anon,authenticated;set role anon');
  assert.equal((await db.query('select count(*)::int n from public.public_jsa_catalog')).rows[0].n,2);
  const record=async(caseId,visitor)=> (await db.query('select public.record_case_study_view($1,$2) n',[caseId,visitor])).rows[0].n;
  assert.equal(await record(id(10),null),null);assert.equal(await record(id(99),id(100)),null);
  assert.equal(Number(await record(id(10),id(100))),1);assert.equal(Number(await record(id(10),id(100))),1);
  assert.equal(Number(await record(id(10),id(101))),2);assert.equal(Number(await record(id(11),id(100))),1);
  await assert.rejects(db.query('update public.case_study_metrics set view_count=999'));
  await assert.rejects(db.query('select * from jsa_metrics_private.case_views'));
  await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(200)}',false)`);
  assert.equal(Number(await record(id(10),id(102))),3);assert.equal(Number(await record(id(10),id(103))),3);
  await db.exec(`reset role;delete from public.case_studies where id='${id(10)}'`);
  assert.equal((await db.query(`select count(*)::int n from public.case_study_metrics where case_id='${id(10)}'`)).rows[0].n,0);
  console.log('PASS: country backfill, public filtering, anonymous/authenticated deduplication, separated locale counts, RLS, deletion cascade');
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
