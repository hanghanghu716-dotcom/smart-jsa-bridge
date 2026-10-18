import test from 'node:test';
import assert from 'node:assert/strict';
import { draftIdentity } from '../src/utils/draftIdentity.js';
import { privacyRegion } from '../api/privacy-region.js';
import { analyticsChoice,storeAnalyticsChoice,REGIONAL_CONSENT_KEY } from '../src/utils/analyticsConsent.js';
import { startAnalyticsFrame } from '../src/utils/analytics.js';
import { createGateway,dailyNetworkActor } from '../api/public-gateway.js';
import { readAllPublic } from '../server/public-content.js';
test('failed and changed authenticated sessions cannot fall back to a guest identity',async()=>{
 const auth={getSession:async()=>({data:{session:{user:{id:'owner'}}}}),getUser:async()=>({data:{user:null},error:Error('offline')})};
 await assert.rejects(draftIdentity({auth}),/offline/);
 auth.getUser=async()=>({data:{user:{id:'other'}}});await assert.rejects(draftIdentity({auth}),/DRAFT_AUTH_CHANGED/);
 auth.getSession=async()=>({data:{session:null},error:Error('broken-session')});await assert.rejects(draftIdentity({auth}),/broken-session/);
 auth.getSession=async()=>({data:{session:null}});assert.equal(await draftIdentity({auth}),null);
});
test('regional analytics is independent of locale and affirmative consent expires',()=>{
 assert.equal(privacyRegion({'x-vercel-ip-country':'KR'},true).requiresConsent,false);
 for(const country of ['GB','DE','CH','CA','BR','SA','RU',undefined])assert.equal(privacyRegion({'x-vercel-ip-country':country},true).requiresConsent,true);
 assert.equal(privacyRegion({'x-vercel-ip-country':'KR'},false).requiresConsent,true);
 const data=new Map([['smartjsa_analytics_opt_out','false']]),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.equal(analyticsChoice(storage),null);storeAnalyticsChoice(storage,true);assert.equal(analyticsChoice(storage),'allowed');
 assert.equal(analyticsChoice(storage,Date.now()+181*86400000),null);storeAnalyticsChoice(storage,false);assert.equal(analyticsChoice(storage),'denied');
});
test('regulated-region collector loads no Google script until affirmative consent',async()=>{
 let handler;const values=new Map(),scripts=[],parent={};
 const win={parent,location:{pathname:'/analytics-frame.html',origin:'https://smartjsabridge.com',protocol:'https:',hostname:'smartjsabridge.com'},navigator:{userAgent:'Browser'},localStorage:{getItem:k=>values.get(k)||null},addEventListener:(_,fn)=>{handler=fn;},removeEventListener(){}};
 startAnalyticsFrame(win,{createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}},()=>Promise.resolve(true));
 const send=()=>handler({source:parent,origin:win.location.origin,data:{type:'smartjsa:page-view',path:'/en-GB',sequence:1}});
 await send();assert.equal(scripts.length,0);
 values.set(REGIONAL_CONSENT_KEY,JSON.stringify({choice:'allowed',time:Date.now()}));await send();assert.equal(scripts.length,1);
});
test('gateway refuses client IP substitution, has bounded inputs and never returns its key',async()=>{
 const key='test-secret-'.repeat(5),calls=[];
 const handler=createGateway({env:{VERCEL:'1',JSA_PUBLIC_GATEWAY_KEY:key},config:{url:'https://db.test',key:'public'},fetcher:async(url,options)=>{calls.push(JSON.parse(options.body));return{ok:true,json:async()=>7};}});
 const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v;}});
 const request={method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'198.51.100.1'},body:{action:'case_view',payload:{id:'00000000-0000-4000-8000-000000000001'}}};
 let res=response();await handler(request,res);assert.equal(res.statusCode,503);assert.equal(calls.length,0);
 request.headers['x-vercel-forwarded-for']='192.0.2.1';res=response();await handler(request,res);assert.equal(res.statusCode,200);assert.equal(res.body,'7');assert.equal(calls[0].p_actor,dailyNetworkActor('192.0.2.1',key));
 assert.notEqual(dailyNetworkActor('192.0.2.1',key,'2026-10-18'),dailyNetworkActor('192.0.2.1',key,'2026-10-19'));
 request.body.payload.detail='x'.repeat(21000);res=response();await handler(request,res);assert.equal(res.statusCode,400);assert.equal(calls.length,1);
 for(const payload of [null,[], 'text', {id:'not-a-uuid'}]){
  request.body={action:'case_view',payload};res=response();await handler(request,res);assert.equal(res.statusCode,400);
 }
 assert.equal(calls.length,1);
});
test('public read budgets abort rather than returning a silently truncated sitemap',async()=>{
 let count=0;const fetcher=async()=>({ok:true,json:async()=>[{id:String(++count).padStart(4,'0'),content:'x'.repeat(100)}]});
 await assert.rejects(readAllPublic('rows',{},fetcher,{pageSize:1,maxRows:3}),/PUBLIC_CONTENT_LIMIT/);assert.equal(count,4);
 count=0;await assert.rejects(readAllPublic('rows',{},fetcher,{pageSize:1,maxBytes:50}),/PUBLIC_CONTENT_LIMIT/);assert.equal(count,1);
 count=0;const capped=async()=>({ok:true,json:async()=>++count<=5?[{id:String(count).padStart(4,'0')}]:[]});
 assert.equal((await readAllPublic('rows',{},capped,{pageSize:1000,maxRows:10})).length,5);
});
