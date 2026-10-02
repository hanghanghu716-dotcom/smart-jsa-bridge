// Runs only against a disposable local PostgreSQL database (CI service).
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
if(!['127.0.0.1','localhost'].includes(process.env.PGHOST)||process.env.PGDATABASE!=='quota_test')throw Error('Use the disposable local quota_test database only.');
function sql(query,marker){
 const p=spawn('psql',['-X','-qAt','-v','ON_ERROR_STOP=1'],{env:process.env});let out='',err='',release;
 const ready=new Promise(resolve=>{release=resolve;});
 p.stdout.on('data',chunk=>{out+=chunk;if(marker&&out.includes(marker))release();});p.stderr.on('data',chunk=>err+=chunk);
 const done=new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',code=>{release();resolve({code,out:out.trim(),err});});});
 p.stdin.end(query);return{done,ready};
}
async function run(q){const r=await sql(q).done;if(r.code)throw Error(r.err);return r.out;}
const owner='10000000-0000-4000-8000-000000000001';
const setup=`create role anon nologin;create role authenticated nologin;create schema auth;create schema jsa_private;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public,jsa_private to anon,authenticated;
create table public.jsa_projects(id uuid primary key default gen_random_uuid(),author_id uuid references auth.users(id),user_id uuid references auth.users(id),title text,is_public boolean default false,form_data jsonb not null default '{}',analysis_data jsonb default '[]');
alter table public.jsa_projects enable row level security;
create policy existing_owner on public.jsa_projects for all to authenticated using(auth.uid()=author_id or auth.uid()=user_id) with check(auth.uid()=author_id or auth.uid()=user_id);
create policy existing_public on public.jsa_projects for select to anon,authenticated using(is_public);
grant select,insert,update,delete on public.jsa_projects to anon,authenticated;
create table public.jsa_beta_access(user_id uuid primary key references auth.users(id),expires_at timestamptz);
insert into auth.users values('${owner}');
insert into public.jsa_projects(author_id,user_id,title) select '${owner}','${owner}','Initial fixture' from generate_series(1,2);`;
const session=`select set_config('request.jwt.claim.sub','${owner}',true);set local role authenticated;`;
const insert=`insert into public.jsa_projects(author_id,user_id,title,is_public) values('${owner}','${owner}','Concurrent fixture',false);`;
(async()=>{
 await run(setup);
 await run('begin;'+fs.readFileSync('supabase/migrations/20260930150840_free_private_project_quota.sql','utf8')+'commit;');
 await run('begin;'+fs.readFileSync('supabase/migrations/20261001162553_community_private_storage_visibility.sql','utf8')+'commit;');
 for(const isolation of ['read committed','repeatable read']){
  const writer=sql(`begin;${session}${insert}select 'QUOTA_SLOT_HELD';select pg_sleep(2);commit;`,'QUOTA_SLOT_HELD');
  await writer.ready;
  const started=Date.now();
  const contender=sql(`begin isolation level ${isolation};${session}select count(*) from public.jsa_projects;${insert}commit;`);
  const [a,b]=await Promise.all([writer.done,contender.done]);
  assert.equal(a.code,0,a.err);assert.notEqual(b.code,0,'Fourth insert unexpectedly committed');
  assert.match(b.err,/FREE_PROJECT_LIMIT|could not serialize access/);assert.ok(Date.now()-started>=1000,'Writes did not overlap');
  assert.equal(await run(`select (select count(*) from public.jsa_projects)::text||':'||(select private_count from jsa_private.project_storage_usage where user_id='${owner}')::text;`),'3:3');
  console.log('PASS:',isolation,'concurrent third/fourth saves: one commit, one rejection, count = 3');
  await run(`delete from public.jsa_projects where id=(select id from public.jsa_projects limit 1);`);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
