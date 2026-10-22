import assert from 'node:assert/strict';
import { parse } from 'parse5';
const site='https://smartjsabridge.com';
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
function find(n,p){return [...(p(n)?[n]:[]),...(n.childNodes||[]).flatMap(c=>find(c,p))];}
const read=path=>fetch(site+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});

for(const [from,to] of [['/about','/en-US/about'],['/en-US/ppe','/en-US/protectiveequipment'],['/ko/guide/common','/ko/guideline/common'],['/en-US/case-study/%20jsa-form-work','/en-US/case-study/jsa-form-work'],['/de-DE/case-study/%20jsa-leak-testing','/de-DE/case-study/jsa-leak-testing'],['/it-IT/case-study/jsa-%20roof-truss','/it-IT/case-study/jsa-roof-truss'],['/ja-JP/case-study/jsa-%20roof-truss','/ja-JP/case-study/jsa-roof-truss']]) {
  const response=await read(from);
  assert.equal(response.status,308,from);
  assert.equal(new URL(response.headers.get('location'),site).pathname,to,from);
  assert.equal((await read(to)).status,200,to);
}
for(const locale of ['zh-CN','zh-TW']) for(const path of ['', '/jrajsa','/case-study/jsa-pump-installation']) assert.equal((await read('/'+locale+path)).status,404,locale+path);
for(const locale of ['en-CA-ON','en-CA-AB','en-CA-BC']) for(const page of ['about','terms','privacy','protectiveequipment']) {
  const response=await read('/'+locale+'/'+page);assert.equal(response.status,200);
  const canonical=find(parse(await response.text()),n=>n.tagName==='link'&&attr(n,'rel')==='canonical');
  assert.equal(canonical.length,1);assert.equal(attr(canonical[0],'href'),`${site}/en-CA/${page}`);
}
const sitemapResponse=await read('/sitemap-static.xml');assert.equal(sitemapResponse.status,200);
const xml=await sitemapResponse.text();
const locations=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
for(const url of locations) {
  assert.ok(!/\/en-CA-(AB|ON|BC)\/(about|terms|privacy|protectiveequipment)$/.test(url),url);
  if(url.endsWith('/explore')) {
    const response=await fetch(url,{signal:AbortSignal.timeout(20000)});assert.equal(response.status,200,`Explore initial HTML: ${url}`);
    const robots=find(parse(await response.text()),n=>n.tagName==='meta'&&attr(n,'name')==='robots');
    assert.equal(robots.length,1);assert.equal(attr(robots[0],'content'),'index,follow',url);
  }
}
console.log('Verified live legacy redirects, retired-language 404s, shared canonicals and indexable sitemap entries.');

const casesResponse=await read('/sitemap-cases.xml');assert.equal(casesResponse.status,200);
const caseXml=await casesResponse.text();
assert.doesNotMatch(caseXml,/(?:%20jsa-form-work|%20jsa-leak-testing|jsa-%20roof-truss)/,'Legacy whitespace slugs must not re-enter discovery');
const quebec=await read('/fr-CA-QC/protectiveequipment');assert.equal(quebec.status,200);
const quebecHtml=await quebec.text();
assert.match(quebecHtml,/<title[^>]*>[^<]*Québec/,'Quebec PPE metadata must identify its jurisdiction');
assert.match(quebecHtml,/cnesst\.gouv\.qc\.ca/,'Quebec guidance must link its local source');
assert.doesNotMatch(quebecHtml,/<title[^>]*>[^<]*CE \/ NF/,'French regulatory metadata must not replace Quebec metadata');
