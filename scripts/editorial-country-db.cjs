// Isolated SQL verification. No production content is inserted or modified.
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();await db.waitReady;
 const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 try{
  await db.exec(`create role anon;create role authenticated;create schema jsa_private;
   grant usage on schema jsa_private to anon,authenticated;
   create table public.jsa_projects(id uuid primary key,title text,public_country text,public_locale text,is_public boolean,updated_at timestamptz);
   create table jsa_private.editorial_links(project_id uuid,kind text,target text);
   create table jsa_private.hidden(id uuid);
   create function jsa_private.community_visible(pid uuid) returns boolean language sql as $$select not exists(select 1 from jsa_private.hidden where id=pid)$$;
   alter table public.jsa_projects enable row level security;
   alter table jsa_private.editorial_links enable row level security;
   revoke all on public.jsa_projects,jsa_private.editorial_links,jsa_private.hidden from anon,authenticated;`);
  await db.exec(fs.readFileSync('supabase/migrations/20261014035806_editorial_jsa_country_filter.sql','utf8'));
  for(let i=1;i<=20;i++){
   await db.query('insert into public.jsa_projects values($1,$2,$3,$4,true,$5)',[id(i),'Korean '+i,'KR','ko','2026-10-14']);
   await db.query("insert into jsa_private.editorial_links values($1,'case','aerial')",[id(i)]);
  }
  for(const [n,country,locale,visible] of [[30,'SG','en-SG',true],[31,'US','en-US',true],[32,'GB','en-GB',true],[33,'SG','en-SG',false],[34,'SG','en-SG',true],[35,'CA','fr-CA-QC',true],[36,null,'en-SG',true]]){
   await db.query('insert into public.jsa_projects values($1,$2,$3,$4,$5,$6)',[id(n),'Country '+country,country,locale,visible,'2026-10-01']);
   await db.query("insert into jsa_private.editorial_links values($1,'case','aerial')",[id(n)]);
  }
  await db.query('insert into jsa_private.hidden values($1)',[id(34)]);
  await db.query("insert into jsa_private.editorial_links values($1,'guide','high-risk')",[id(30)]);
  const read=async(country,kind='case',target='aerial')=>(await db.query('select public.editorial_jsa_by_country($1,$2,$3) result',[kind,target,country])).rows[0].result;
  for(const role of ['anon','authenticated']){
   await db.exec('set role '+role);
   const sg=await read('SG');assert.deepEqual(sg.map(row=>row.id),[id(30)]);
   assert.equal((await read('KR')).length,12); // Limit is applied after country, not before it.
   assert.deepEqual((await read('US')).map(row=>row.id),[id(31)]);
   assert.deepEqual((await read('GB')).map(row=>row.id),[id(32)]);
   assert.deepEqual((await read('CA')).map(row=>row.id),[id(35)]);
   assert.deepEqual((await read('SG','guide','high-risk')).map(row=>row.id),[id(30)]);
   for(const args of [[null],['invalid'],['AU'],['SG','invalid'],['SG','case','missing']])assert.deepEqual(await read(...args),[]);
   await assert.rejects(db.query('select * from jsa_private.editorial_links'));
   await db.exec('reset role');
  }
  await db.query('update public.jsa_projects set is_public=false where id=$1',[id(30)]);
  assert.deepEqual(await read('SG'),[]);
  console.log('PASS: country before limit, separate English countries, Canada, public/hidden filtering, withdrawal, invalid/empty inputs and anon/authenticated permissions');
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
