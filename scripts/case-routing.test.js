import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { canonicalCaseSlug, caseLookupSlugs, casePath, canonicalCaseLink } from '../src/utils/caseRouting.js';
import { createCaseHandler, fetchCaseWithRetry } from '../api/case-study.js';
import { buildSitemap } from './sitemap-data.js';
const shell='<html><head></head><body><div id="root"></div></body></html>';
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}});

test('Case Study transient reads retry once; permanent failures and deadline remain authoritative',async()=>{
 for(const first of [429,500,503,'network']) {
  let calls=0;
  const options={signal:AbortSignal.timeout(3000),cache:'no-store'};
  const result=await fetchCaseWithRetry(async(url,received)=>{
   assert.equal(received,options);calls++;
   if(calls===1){if(first==='network')throw new TypeError('fetch failed');return new Response('',{status:first});}
   return Response.json([]);
  },'https://example.test',options);
  assert.equal(result.status,200);assert.equal(calls,2);
 }
 for(const status of [400,401,403,404,503]) {
  let calls=0;
  const result=await fetchCaseWithRetry(async()=>{calls++;return new Response('',{status});},'https://example.test',{});
  assert.equal(result.status,status);assert.equal(calls,status===503?2:1);
 }
 const controller=new AbortController();let calls=0;
 await assert.rejects(fetchCaseWithRetry(async()=>{
  calls++;controller.abort();throw new TypeError('aborted');
 },'https://example.test',{signal:controller.signal}));
 assert.equal(calls,1);
});

test('persistent upstream failure stays 503 and a missing Case Study stays 404',async()=>{
 for(const [status,expected] of [[503,503],[200,404]]) {
  const handler=createCaseHandler({fetcher:async()=>Response.json([],{status}),readShell:async()=>shell});
  const res=response();await handler({query:{lng:'en-US',slug:'missing-case'}},res);
  assert.equal(res.statusCode,expected);assert.equal(res.headers['X-Robots-Tag'],'noindex');
  if(status===503)assert.equal(res.headers['Retry-After'],'60');
 }
});

test('legacy public URLs converge without renaming stored groups or unrelated slugs',()=>{
 for(const [legacy,canonical] of [[' jsa-form-work','jsa-form-work'],[' jsa-leak-testing','jsa-leak-testing'],['jsa- roof-truss','jsa-roof-truss']]) {
  assert.equal(canonicalCaseSlug(legacy),canonical);
  assert.ok(caseLookupSlugs(canonical).includes(legacy));
  assert.equal(casePath('en-US',legacy),'/en-US/case-study/'+canonical);
  assert.equal(canonicalCaseLink('/en-US/case-study/'+encodeURIComponent(legacy)+'?view=1#body'),'/en-US/case-study/'+canonical+'?view=1#body');
 }
 assert.equal(canonicalCaseSlug('pipe & tank'),'pipe & tank');
 assert.equal(canonicalCaseLink('/analysis?title= jsa-form-work'),'/analysis?title= jsa-form-work');
 const redirects=JSON.parse(fs.readFileSync('vercel.json')).redirects;
 assert.ok(!redirects.some(r=>r.destination.includes('%20jsa-')));
});

test('clean URLs read original IDs, local-language bodies only, and preserve article content',async()=>{
 const rows=[{id:'a',language_code:'en-US',post_group_id:' jsa-form-work',title:'Form work',content_md:'## Original unchanged body',created_at:'2026-01-01'},
 {id:'b',language_code:'ko',post_group_id:'jsa-form-work',title:'Korean',content_md:'Korean body'}];
 const requests=[];
 const fetcher=async url=>{
  const p=new URL(url).searchParams;requests.push(p);
  if(p.has('id'))return Response.json([]);
  assert.match(p.get('post_group_id'),/" jsa-form-work"/);
  if(p.get('select')==='*') {
   assert.equal(p.get('language_code'),'in.(en-US)');
   return Response.json([rows[0]]);
  }
  assert.equal(p.get('select'),'id,language_code,post_group_id');
  return Response.json(rows.map(({id,language_code,post_group_id})=>({id,language_code,post_group_id})));
 };
 const handler=createCaseHandler({fetcher,readShell:async()=>shell});
 let res=response();await handler({query:{lng:'en-US',slug:'jsa-form-work'}},res);
 assert.equal(res.statusCode,200);assert.match(res.body,/Original unchanged body/);
 assert.match(res.body,/"post_group_id":" jsa-form-work"/);
 assert.match(res.body,/rel="canonical" href="https:\/\/smartjsabridge.com\/en-US\/case-study\/jsa-form-work"/);
 assert.doesNotMatch(res.body,/Korean body/);
 res=response();await handler({query:{lng:'en-US',slug:' jsa-form-work'}},res);
 assert.equal(res.statusCode,308);assert.equal(res.headers.Location,'/en-US/case-study/jsa-form-work');
 const xml=buildSitemap(rows,{includeStatic:false});
 assert.doesNotMatch(xml,/%20jsa-form-work/);
 assert.equal((xml.match(/<loc>/g)||[]).length,2);
});
