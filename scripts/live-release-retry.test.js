import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { verifyLiveRelease } from './verify-live-release.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { GUIDE_CATEGORIES } from '../src/utils/guideContent.js';

const bytes = Buffer.from('%PDF-test fixture bytes');
const sha256 = createHash('sha256').update(bytes).digest('hex');
const expected = SUPPORTED_LANGS.flatMap(locale => Object.keys(GUIDE_CATEGORIES).map(category => ({locale, route:`/${locale}/guideline/${category}`, pdf:`/assets/guides/${locale}/${category}-2026-10-09.pdf`, sha256})));
const stale = expected.map(x => ({...x,sha256:'0'.repeat(64)}));
function server(manifests, {brokenHtml=false, brokenPdf=false, badEntry=false, manifestStatus=200} = {}) {
  let count=0; const requests=[];
  const fetcher=async (url, options) => {
    assert.equal(options.headers['Cache-Control'],'no-cache'); requests.push(url);
    const path=new URL(url).pathname;
    if(path==='/assets/guides/manifest.json') return new Response(JSON.stringify(manifests[Math.min(count++,manifests.length-1)]),{status:manifestStatus,headers:{'Content-Type':'application/json','x-fixture-attempt':String(count)}});
    const g=expected.find(x=>x.route===path);
    if(g)return new Response(brokenHtml?'no document':`<div id="guide-document" data-guide-locale="${g.locale}">${g.pdf}</div><script type="application/ld+json">{}</script>`);
    if(expected.some(x=>x.pdf===path))return new Response(brokenPdf?Buffer.from('%PDF-corrupt bytes'):bytes,{headers:{'Content-Type':'application/pdf'}});
    return new Response('window.__PUBLIC_EXPLORE__=',{headers:{'Cache-Control':badEntry?'public':'no-store'}});
  };
  return {fetcher,requests,count:()=>count};
}
test('current release verifies all guides once without sleeping',async()=>{
  const s=server([expected]), attempts=[];
  const r=await verifyLiveRelease({expected,fetcher:s.fetcher,sleep:()=>{throw Error('unexpected retry');},onManifestAttempt:x=>attempts.push(x)});
  assert.equal(r.verified,expected.length);assert.deepEqual(r.failures,[]);assert.equal(s.count(),1);assert.equal(s.requests.length,1+2*expected.length+4);assert.equal(attempts[0].error,null);
});
test('valid stale release followed by exact release retries only manifest then checks every HTML/PDF',async()=>{
  const s=server([stale,expected]), attempts=[], waits=[];
  const r=await verifyLiveRelease({expected,fetcher:s.fetcher,sleep:async ms=>waits.push(ms),onManifestAttempt:x=>attempts.push(x)});
  assert.equal(r.verified,expected.length);assert.deepEqual(r.failures,[]);assert.deepEqual(waits,[5000]);assert.equal(s.count(),2);assert.equal(s.requests.length,2+2*expected.length+4);assert.equal(attempts[0].error,'LIVE_RELEASE_NOT_CURRENT');assert.equal(attempts[0].manifest[0].sha256,stale[0].sha256);assert.equal(attempts[1].headers['x-fixture-attempt'],'2');
});
test('persistent mismatch remains failure after bounded attempts and never proceeds to guide checks',async()=>{
  const s=server([stale]), waits=[];
  await assert.rejects(verifyLiveRelease({expected,fetcher:s.fetcher,sleep:async ms=>waits.push(ms)}),/LIVE_RELEASE_NOT_CURRENT/);
  assert.equal(s.count(),6);assert.equal(s.requests.length,6);assert.equal(waits.length,5);
});
test('incomplete manifest fails immediately rather than treating corruption as propagation',async()=>{
  const s=server([expected.slice(1)]);
  await assert.rejects(verifyLiveRelease({expected,fetcher:s.fetcher,sleep:()=>{throw Error('unexpected retry');}}),/LIVE_MANIFEST_INCOMPLETE/);assert.equal(s.count(),1);
});
test('HTTP failure is not hidden by retries',async()=>{
  const s=server([expected],{manifestStatus:503});await assert.rejects(verifyLiveRelease({expected,fetcher:s.fetcher}),/HTTP_503/);assert.equal(s.count(),1);
});
test('PDF byte mismatch still fails after successful manifest convergence',async()=>{
  const s=server([stale,expected],{brokenPdf:true});const r=await verifyLiveRelease({expected,fetcher:s.fetcher,sleep:async()=>{}});assert.equal(r.verified,0);assert.equal(r.failures.length,expected.length);assert.ok(r.failures.every(x=>x.error==='PDF_MISMATCH'));
});
test('missing initial HTML and entry cache policy failures are still enforced',async()=>{
  const s=server([expected],{brokenHtml:true,badEntry:true});const r=await verifyLiveRelease({expected,fetcher:s.fetcher});assert.equal(r.verified,0);assert.equal(r.failures.length,expected.length+1);assert.equal(r.failures.at(-1).error,'EXPLORE_DELIVERY');
});
test('malformed local expectation and excessive retry settings fail without network access',async()=>{
  const fetcher=()=>{throw Error('network must not be called');};await assert.rejects(verifyLiveRelease({expected:expected.slice(1),fetcher}),/LIVE_MANIFEST_INCOMPLETE/);await assert.rejects(verifyLiveRelease({expected,fetcher,manifestAttempts:11}),/INVALID_MANIFEST_RETRY_OPTIONS/);
});
test('CLI failure persists expected manifest, observed response and error for the CI artifact',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jsa-release-check-'));
  try {
    fs.writeFileSync(path.join(dir,'expected.json'),JSON.stringify(expected));
    fs.writeFileSync(path.join(dir,'mock.mjs'),`globalThis.fetch=async()=>new Response('[]',{headers:{'content-type':'application/json','x-fixture':'failure'}});`);
    const script=fileURLToPath(new URL('./verify-live-release.js',import.meta.url));
    const result=spawnSync(process.execPath,['--import',pathToFileURL(path.join(dir,'mock.mjs')).href,script,'expected.json'],{cwd:dir,encoding:'utf8',timeout:10000});
    assert.equal(result.status,1);assert.match(result.stderr,/LIVE_MANIFEST_INCOMPLETE/);
    const diagnostic=JSON.parse(fs.readFileSync(path.join(dir,'.cache/live-release-check.json'),'utf8'));
    assert.equal(diagnostic.expected.length,expected.length);assert.equal(diagnostic.attempts.length,1);assert.equal(diagnostic.attempts[0].headers['x-fixture'],'failure');assert.deepEqual(diagnostic.attempts[0].manifest,[]);assert.equal(diagnostic.error,'LIVE_MANIFEST_INCOMPLETE');
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
