import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicHandler, renderPublicHtml } from '../api/public-jsa.js';
import { publicJsaView, publicJsaQuality, publicForkState, safeReturnPath } from '../src/utils/publicJsa.js';
import { getPublicUi } from '../src/locales/publicUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { staticRoutes } from './static-routes.js';
import fs from 'node:fs';
const id = '10000000-0000-4000-8000-000000000001';
const row = { id, author_id: 'author', is_public: true, public_locale: 'ko', title: 'Installation inspection',
  form_data: { projectName: 'Installation inspection', workDate: 'private', workLocation: 'private', ppe: [] }, participants: ['private'],
  analysis_data: ['Prepare', 'Lift', 'Inspect'].map(stepTitle => ({ proc: { stepTitle, stepDetail: 'Inspect the access route, equipment and work area before starting the task.' }, risks: [{ factor: 'Falling objects and collision', measure: 'Isolate the work area with barriers and inspect lifting equipment before use.' }], customFields: { NAME: 'private' } })),
  custom_layout: { documentNotes: 'private', stepPhotos: { 0: 'private' } } };
const shell = '<!doctype html><html><head></head><body><div id="root"></div></body></html>';
function response() { return { headers: {}, setHeader(k,v) { this.headers[k]=v; }, end(body) { this.body=body; } }; }

test('public projection strips private fields and forks without a writable source id', () => {
  const before = JSON.stringify(row), safe = publicJsaView(row), fork = publicForkState(row);
  assert.equal(safe.form_data.workDate, undefined); assert.deepEqual(safe.participants, []);
  assert.equal(safe.custom_layout.stepPhotos, undefined); assert.equal(safe.custom_layout.documentNotes, '');
  assert.equal(fork.existingId, null); assert.equal(fork.parentId, id); assert.equal(fork.projectSaveContext.own, false);
  assert.equal(JSON.stringify(row), before); assert.equal(publicJsaView({ ...row, is_public: false }), null);
});
test('indexing requires meaningful, distinct steps and a declared content language', () => {
  assert.equal(publicJsaQuality(row).indexable, true);
  for (const change of [{ public_locale: null }, { title: 'Untitled JSA' }, { is_public: false }, { analysis_data: row.analysis_data.slice(0,2) }, { analysis_data: [row.analysis_data[0],row.analysis_data[0],row.analysis_data[0]] }]) assert.equal(publicJsaQuality({ ...row,...change }).indexable, false);
});
test('server HTML contains actual public content, canonical language, safe JSON and no personal data', () => {
  const html = renderPublicHtml(shell, { ...row, title: '</script><script>alert(1)</script>' }, 'en-US');
  assert.match(html, /Inspect the access route/); assert.match(html, /\/ko\/public-jsa\//); assert.doesNotMatch(html, /private|hrefLang|hreflang|<script>alert/);
  assert.match(html, /\\u003c\/script/);
});
test('live endpoint checks public visibility on every request and never caches private responses', async () => {
  let publicNow=true, calls=0;
  const handler=createPublicHandler({ readShell: async()=>shell, fetcher: async url => { calls++; assert.equal(new URL(url).searchParams.get('is_public'),'eq.true'); return { ok:true,json:async()=>publicNow?[row]:[] }; } });
  const first=response();await handler({query:{id,lng:'ko'}},first);assert.equal(first.statusCode,200);
  publicNow=false;const second=response();await handler({query:{id,lng:'ko'}},second);assert.equal(second.statusCode,404);assert.match(second.body,/noindex/);assert.doesNotMatch(second.body,/Installation inspection/);assert.match(second.headers['Cache-Control'],/no-store/);assert.equal(calls,2);
});
test('database failures return noindex 503 and malformed IDs do not hit the database',async()=>{
  let calls=0;const handler=createPublicHandler({readShell:async()=>shell,fetcher:async()=>{calls++;throw Error('offline');}});
  const bad=response();await handler({query:{id:'bad',lng:'ko'}},bad);assert.equal(bad.statusCode,404);assert.equal(calls,0);
  const failed=response();await handler({query:{id,lng:'ko'}},failed);assert.equal(failed.statusCode,503);assert.match(failed.body,/noindex/);
});
test('return paths reject external redirects and all supported locales have complete public labels',()=>{
  for(const value of ['https://evil.test','//evil.test','/\\evil.test','/\n/evil.test',null]) assert.equal(safeReturnPath(value),'/');
  assert.equal(safeReturnPath('/ko/public-jsa/'+id),'/ko/public-jsa/'+id);
  for(const locale of SUPPORTED_LANGS) for(const value of Object.values(getPublicUi(locale))) assert.ok(typeof value==='string' && value.length);
});
test('static publishing never snapshots user-owned routes, even when they are linked publicly',()=>{
  const routes=staticRoutes([{route:'/ko/case-study/example'},{route:'/ko/public-jsa/'+id},{route:'/ko/business'}]);
  assert.ok(routes.includes('/ko/case-study/example'));
  assert.ok(routes.includes('/en-CA-AB/guideline/common'));
  assert.ok(routes.every(route=>!/(?:explore|public-jsa|business|library|login|export|profile)/.test(route)));
  assert.match(fs.readFileSync(new URL('./prerender-cases.js',import.meta.url),'utf8'),/crawl: false/);
});
test('malformed community fields cannot inject objects into the document renderer',()=>{
  const safe=publicJsaView({...row,form_data:{projectName:{bad:true},ppe:'bad',permits:[{}]},analysis_data:[null,{proc:{stepTitle:{}},risks:[null,{factor:{bad:true}}]}],custom_layout:{docTitle:{},documentBlocks:[null],savedActiveOrder:[null,{}],savedUserColumns:[null],savedColumnOverrides:{DATA_HAZARD:null}}});
  assert.equal(safe.form_data.projectName,'');assert.deepEqual(safe.form_data.ppe,[]);assert.equal(safe.analysis_data[0].proc.stepTitle,'');assert.equal(safe.analysis_data[0].risks[0].factor,'');assert.deepEqual(safe.custom_layout.savedUserColumns,[]);
});
