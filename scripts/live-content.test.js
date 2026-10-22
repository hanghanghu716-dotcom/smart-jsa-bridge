import test from 'node:test';
import assert from 'node:assert/strict';
import { createCaseHandler, renderCaseHtml } from '../api/case-study.js';
import { createContentFeedHandler, buildFeed, buildPublicSitemap } from '../api/content-feed.js';
import { createContentIndexHandler, renderIndexHtml } from '../api/content-index.js';
import { buildSitemap } from './sitemap-data.js';
import { readAllPublic, sendContent } from '../server/public-content.js';
import { verifyCaseHtml, buildCaseManifest } from './case-build-data.js';
const shell='<!doctype html><html><head></head><body><div id="root"></div></body></html>';
const post={id:'a',post_group_id:'pipe & tank',language_code:'ko',title:'Pipe & Tank',meta_description:'Current summary',content_md:'## Current body\n\n<table><tr><td colspan="2">Safe</td></tr></table>',created_at:'2026-10-01T00:00:00Z'};
function response(){return {headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(body){this.body=body;}};}
function fake(rows){return async url=>{const p=new URL(url).searchParams;return Response.json(p.get('id')?.startsWith('gt.')?[]:rows);};}
test('new and edited cases are read on every request without a rebuild',async()=>{
 let rows=[post];const handler=createCaseHandler({fetcher:async url=>fake(rows)(url),readShell:async()=>shell});
 const req={query:{lng:'ko',slug:post.post_group_id},headers:{}};
 let res=response();await handler(req,res);assert.equal(res.statusCode,200);assert.match(res.body,/Current body/);
 assert.equal(verifyCaseHtml(res.body,buildCaseManifest(rows)[0]),true);
 rows=[{...post,content_md:'## Updated immediately'}];res=response();await handler(req,res);assert.match(res.body,/Updated immediately/);assert.doesNotMatch(res.body,/>Current body</);
});
test('missing translations and withdrawn cases return 404; upstream errors return retryable 503',async()=>{
 for(const [fetcher,lng,status] of [[fake([post]),'en-US',404],[fake([]),'ko',404],[async()=>new Response('',{status:500}),'ko',503]]){
  const res=response();await createCaseHandler({fetcher,readShell:async()=>shell})({query:{lng,slug:post.post_group_id}},res);assert.equal(res.statusCode,status);assert.equal(res.headers['x-robots-tag'],'noindex');
 }
});
test('missing provincial content does not redirect to generic Canada and malicious route inputs cannot escape paths',async()=>{
 const handler=createCaseHandler({fetcher:fake([{...post,language_code:'en-CA'}]),readShell:async()=>shell});let res;
 for(const lng of ['en-CA-AB','en-CA-BC','en-CA-ON','fr-CA-QC']){res=response();await handler({query:{lng,slug:post.post_group_id}},res);assert.equal(res.statusCode,404);assert.equal(res.headers.location,undefined);}
 res=response();await handler({query:{lng:'en-CA',slug:post.post_group_id}},res);assert.equal(res.statusCode,200);
 for(const slug of ['../x','x/y','x\\y',['x']]){res=response();await handler({query:{lng:'ko',slug}},res);assert.equal(res.statusCode,404);}
});
test('initial article HTML sanitizes active markup and keeps safe tables and escaped bootstrap content',()=>{
 const html=renderCaseHtml(shell,{...post,content_md:'<script>alert(1)</script><img src="x" onerror="alert(2)"><table><tr><td>Text</td></tr></table>'},'ko',['ko']);
 const article=html.split('<article')[1].split('</article>')[0];assert.doesNotMatch(article,/<script|onerror=/);assert.match(article,/<table>/);assert.match(html,/\\u003cscript/);
});
test('conditional responses only use 304 for a body freshly verified unchanged',()=>{
 const first=response();sendContent({headers:{}},first,'one');const second=response();sendContent({headers:{'if-none-match':first.headers.etag}},second,'one');assert.equal(second.statusCode,304);
 const changed=response();sendContent({headers:{'if-none-match':first.headers.etag}},changed,'two');assert.equal(changed.statusCode,200);assert.equal(changed.headers['vercel-cdn-cache-control'],'no-store');
});
test('case sitemap includes actual dates only; test/private/duplicate public documents never enter discovery feeds',()=>{
 const xml=buildSitemap([{...post,content_updated_at:'2026-10-13T00:00:00Z'}],{includeStatic:false});assert.match(xml,/<lastmod>2026-10-13T00:00:00.000Z/);assert.doesNotMatch(buildSitemap([post]),/<lastmod>/);
 const docs=[{id:'test',title:'TEST_document',is_public:true},{id:'private',is_public:false}];assert.doesNotMatch(buildPublicSitemap(docs),/<url>/);assert.doesNotMatch(buildFeed([post],docs,'ko'),/TEST_document/);
});
test('public sitemap and RSS admit only an indexable original-language document',()=>{
 const row={id:'12345678-1234-4234-8234-123456789012',title:'A real public document',is_public:true,public_locale:'ko',reuse_license:'community-v1',assessment:{checked:true},analysis_data:Array.from({length:3},(_,i)=>({proc:{stepTitle:'Step '+i,stepDetail:'Detailed description of the step '.repeat(4)},risks:[{factor:'Risk',measure:'Control'}]})),content_updated_at:'2026-10-13T00:00:00Z'};
 assert.match(buildPublicSitemap([row]),/\/ko\/public-jsa\//);assert.match(buildFeed([], [row],'ko'),/A real public document/);assert.doesNotMatch(buildFeed([], [row],'en-US'),/A real public document/);assert.doesNotMatch(buildPublicSitemap([{...row,assessment:{checked:true,duplicate_of:row.id}}]),/<url>/);
});
test('home and archive use live links while preserving the existing page layout',()=>{
 const template='<html><head><title>Home</title></head><body><header>Brand</header><div data-live-case-list="home">Old links</div><footer>Footer</footer></body></html>';
 const html=renderIndexHtml(template,[post],'ko','home');assert.match(html,/<header>Brand<\/header>/);assert.match(html,/pipe%20%26%20tank/);assert.doesNotMatch(html,/Old links/);assert.match(html,/window.__CASE_LIST__/);
});
test('index and sitemap failures never emit empty successful pages',async()=>{
 const fetcher=async()=>{throw Error('offline');};
 for(const [handler,query] of [[createContentFeedHandler({fetcher}),{kind:'cases'}],[createContentIndexHandler({fetcher}),{lng:'ko',kind:'archive'}]]){const res=response();await handler({query},res);assert.equal(res.statusCode,503);}
});
test('the sitemap index omits an empty public section until an eligible document is published',async()=>{
 const row={id:'12345678-1234-4234-8234-123456789012',title:'A real public document',is_public:true,public_locale:'ko',reuse_license:'community-v1',assessment:{checked:true},analysis_data:Array.from({length:3},(_,i)=>({proc:{stepTitle:'Step '+i,stepDetail:'Detailed description of the step '.repeat(4)},risks:[{factor:'Risk',measure:'Control'}]}))};
 for(const rows of [[],[{...row,title:'TEST_document'}],[row]]){
  const res=response();await createContentFeedHandler({fetcher:fake(rows)})({query:{kind:'index'}},res);
  assert.equal(res.statusCode,200);assert.equal(res.body.includes('sitemap-public.xml'),rows[0]===row);
 }
});
test('pagination reads all rows even when the database caps a page below 1000',async()=>{
 const rows=await readAllPublic('case_studies',{select:'id'},async url=>{const p=new URL(url).searchParams;return Response.json(!p.has('id')?[{id:'a'},{id:'b'}]:p.get('id')==='gt.b'?[{id:'c'}]:[]);});assert.equal(rows.length,3);
});
