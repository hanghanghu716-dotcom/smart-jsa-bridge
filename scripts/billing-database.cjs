// Isolated PostgreSQL only. Never point this script at a hosted customer database.
const {execFileSync,execFile}=require('node:child_process');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
if(!['127.0.0.1','localhost'].includes(process.env.PGHOST)||process.env.PGDATABASE!=='billing_test')throw Error('An isolated local billing_test database is required.');
const root=path.join(__dirname,'..');
const args=['-X','-q','-t','-A','-v','ON_ERROR_STOP=1'];
const sql=text=>execFileSync('psql',args,{input:text,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const asyncSql=text=>new Promise((resolve,reject)=>{const p=execFile('psql',args,{encoding:'utf8'},(error,stdout)=>error?reject(error):resolve(stdout.trim()));p.stdin.end(text);});
const literal=value=>"'"+JSON.stringify(value).replaceAll("'","''")+"'::jsonb";
const user='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
const auth=(id,query)=>`set role authenticated;set request.jwt.claim.sub='${id}';set request.jwt.claim.role='authenticated';${query}`;
const service=(action,payload)=>`set role service_role;set request.jwt.claim.role='service_role';select public.jsa_billing_service('${action}',${literal(payload)});`;
const rpc=(action,payload)=>JSON.parse(sql(service(action,payload)));
const oid=(mode,n)=>`jsa_${mode}_20000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const create=(mode,n,id=user)=>({order_id:oid(mode,n),mode,user_id:id,amount:9900,currency:'KRW',terms_version:'fixture-v1'});
const bind=order=>rpc('bind',{mode:order.mode,user_id:order.user_id,order_id:order.id,payment_key:'key-'+order.id});
const applied=(order,status='DONE')=>({mode:order.mode,order_id:order.id,payment_key:order.payment_key,amount:9900,currency:'KRW',status,balance:status==='CANCELED'?0:9900,approved_at:new Date().toISOString()});
const access=id=>JSON.parse(sql(auth(id,'select public.jsa_professional_access();')));
async function main(){
 sql(`create role anon;create role authenticated;create role service_role;create schema auth;create schema jsa_private;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select nullif(current_setting('request.jwt.claim.role',true),'')$$;
 grant usage on schema auth to anon,authenticated,service_role;
 create table public.jsa_projects(id uuid primary key default gen_random_uuid(),author_id uuid,user_id uuid,is_public boolean default false,title text,project_name text,form_data jsonb,analysis_data jsonb,participants jsonb,custom_layout jsonb,updated_at timestamptz default now());
 grant select,insert,update on public.jsa_projects to authenticated;
 insert into auth.users values('${user}'),('${other}');`);
 sql(fs.readFileSync(path.join(root,'supabase/migrations/20260930125935_phase6_free_business_beta.sql'),'utf8'));
 sql(fs.readFileSync(path.join(root,'supabase/migrations/20261106055451_professional_pass.sql'),'utf8'));
 assert.throws(()=>sql(auth(user,`select public.jsa_billing_service('create',${literal(create('live',1))});`)),/permission denied/);
 assert.throws(()=>sql(auth(user,'select * from jsa_private.billing_orders;')),/permission denied/);
 assert.throws(()=>sql('set role anon;select public.jsa_professional_access();'),/permission denied/);
 assert.equal(access(user).active,false);
 assert.throws(()=>rpc('create',{...create('live',1),amount:1}),/INVALID_INPUT/);
 console.log('PASS: authenticated/anonymous users cannot read payment keys or self-grant paid access.');

 const testOrder=bind(rpc('create',create('test',1)));
 rpc('apply',applied(testOrder));assert.equal(access(user).active,false,'test orders must not unlock live features');
 assert.throws(()=>sql(auth(user,`select public.jsa_business_action('create_org',p_payload:='{"name":"Test must fail"}');`)),/BETA_REQUIRED/);
 console.log('PASS: successful test payments cannot create production entitlements.');

 const concurrent=await Promise.all([1,2,3,4].map(n=>asyncSql(service('create',create('live',n))).then(JSON.parse)));
 assert.equal(new Set(concurrent.map(x=>x.id)).size,1,'parallel checkout creation reuses one pending order');
 const paid=bind(concurrent[0]);
 assert.throws(()=>rpc('create',create('live',9)),/PAYMENT_PENDING/);
 sql(`update jsa_private.billing_orders set checkout_expires_at=now()-interval '1 minute' where id='${paid.id}';`);
 assert.throws(()=>rpc('create',create('live',9)),/PAYMENT_PENDING/,'a potentially charged order must be reconciled before any new checkout');
 assert.throws(()=>rpc('get',{order_id:paid.id,mode:'live',user_id:other}),/NOT_FOUND/);
 assert.throws(()=>rpc('bind',{order_id:paid.id,mode:'live',user_id:user,payment_key:'substitution'}),/PAYMENT_KEY_CONFLICT/);
 const confirmations=await Promise.all([1,2,3,4].map(()=>asyncSql(service('apply',applied(paid))).then(JSON.parse)));
 assert.equal(new Set(confirmations.map(x=>x.expires_at)).size,1,'concurrent callbacks must grant exactly one period');
 assert.equal(Date.parse(confirmations[0].expires_at)-Date.parse(confirmations[0].starts_at),30*86400000);
 assert.equal(access(user).source,'paid');assert.equal(access(other).active,false);
 assert.throws(()=>rpc('create',create('live',9)),/ACCESS_ACTIVE/);
 console.log('PASS: concurrent create/confirmation, one 30-day period, ownership and price checks.');

 const org=JSON.parse(sql(auth(user,`select public.jsa_business_action('create_org',p_payload:='{"name":"Paid company"}');`)));
 const status=JSON.parse(sql(auth(user,`select public.jsa_business_action('org_status',p_org:='${org.id}');`)));
 assert.equal(status.active,true);assert.equal(status.source,'paid');
 sql(auth(user,`insert into public.jsa_projects(author_id,user_id,title,form_data,analysis_data,participants,custom_layout) values('${user}','${user}','Paid revision','{}','[]','[]','{}');`));
 assert.equal(Number(sql(auth(user,'select count(*) from public.jsa_project_revisions;'))),1);
 const refund=rpc('refund',{order_id:paid.id,mode:'live',user_id:user});assert.ok(refund.refund_requested_at);
 rpc('apply',applied(paid,'CANCELED'));assert.equal(access(user).active,false);
 rpc('apply',applied(paid));assert.equal(access(user).active,false,'stale success cannot undo cancellation');
 assert.equal(Number(sql(auth(user,'select count(*) from public.jsa_project_revisions;'))),1,'cancel preserves readable history');
 assert.throws(()=>sql(auth(user,`select public.jsa_business_action('create_org',p_payload:='{"name":"Canceled must fail"}');`)),/BETA_REQUIRED/);
 console.log('PASS: paid company writes/revisions work, refunds revoke access, history remains readable.');

 const expiring=bind(rpc('create',create('live',10)));rpc('apply',applied(expiring));
 sql(`update jsa_private.billing_orders set starts_at=now()-interval '31 days',expires_at=now()-interval '1 day' where id='${expiring.id}';`);
 assert.equal(access(user).active,false,'expiry uses database clock');
 sql(auth(other,`select public.jsa_business_action('start_beta');`));assert.equal(access(other).source,'trial');
 assert.throws(()=>rpc('create',create('live',11,other)),/ACCESS_ACTIVE/);
 const expired=rpc('create',create('live',12));sql(`update jsa_private.billing_orders set checkout_expires_at=now()-interval '1 minute' where id='${expired.id}';`);
 assert.throws(()=>bind(expired),/ORDER_EXPIRED/);
 console.log('PASS: expiry, preserved one-time free trial, and stale checkout protection.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
