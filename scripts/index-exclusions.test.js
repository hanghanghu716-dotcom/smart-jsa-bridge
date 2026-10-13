import test from 'node:test';
import assert from 'node:assert/strict';
import { staticCanonicalLocale } from '../src/utils/indexing.js';
import { exploreIndexable, indexableExploreLocales } from '../src/utils/exploreIndexing.js';
import { renderExploreHtml } from '../api/explore.js';
import { createContentFeedHandler } from '../api/content-feed.js';
import retiredLocale from '../api/retired-locale.js';
import { buildSitemap } from './sitemap-data.js';
import { verifyStaticMetadata } from './static-metadata.js';
import { exploreQuery } from '../src/utils/discovery.js';

const row = { id:'10000000-0000-4000-8000-000000000001', title:'Published equipment inspection', is_public:true,
  public_locale:'ko', public_country:'CA', published_at:'2026-10-13T00:00:00Z', assessment:{checked:true}, reuse_license:'community-v1',
  analysis_data:Array.from({length:3},(_,i)=>({proc:{stepTitle:'Step '+i,stepDetail:'Detailed procedure for the equipment inspection. '.repeat(3)},risks:[{factor:'Moving equipment',measure:'Isolate before inspection'}]})) };
const shell='<html><head></head><body><div id="root"></div></body></html>';
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}});

test('shared Canadian pages consolidate without changing provincial guides or case studies',()=>{
  for(const locale of ['en-CA-AB','en-CA-ON','en-CA-BC']) {
    for(const page of ['about','terms','privacy','protectiveequipment']) assert.equal(staticCanonicalLocale(locale,page),'en-CA');
    for(const page of ['', 'regulation','guideline/construction','archive','case-study/demo','explore']) assert.equal(staticCanonicalLocale(locale,page),locale);
  }
  assert.equal(staticCanonicalLocale('fr-CA-QC','about'),'fr-CA-QC');
  const xml=buildSitemap([]);
  assert.ok(xml.includes('<loc>https://smartjsabridge.com/en-CA/about</loc>'));
  assert.ok(!xml.includes('<loc>https://smartjsabridge.com/en-CA-ON/about</loc>'));
  assert.ok(xml.includes('<loc>https://smartjsabridge.com/en-CA-ON/regulation</loc>'));
  const html='<head><title>About</title><meta name="description" content="About Canada"><meta name="robots" content="index,follow"><link rel="canonical" href="https://smartjsabridge.com/en-CA/about"></head>';
  assert.equal(verifyStaticMetadata(html,'/en-CA-ON/about'),true);
  assert.throws(()=>verifyStaticMetadata(html,'/en-CA-ON/regulation'),/mismatched/);
});

test('empty and test-only Explore pages stay noindex in the initial HTML and shared client policy',()=>{
  for(const rows of [[],[{...row,title:'TEST_fixture'}],[{...row,assessment:{checked:false}}]]) {
    assert.equal(exploreIndexable(rows),false);
    assert.match(renderExploreHtml(shell,{rows,total:rows.length},'en-CA',exploreQuery()),/content="noindex,follow"/);
    assert.deepEqual(indexableExploreLocales(rows),[]);
  }
  assert.match(renderExploreHtml(shell,{rows:[row],total:1},'en-CA',exploreQuery()),/content="index,follow"/);
  for(const query of [{search:'equipment'},{tags:['hazard']},{sort:'views'},{country:'all'}]) assert.equal(exploreIndexable([row],query),false);
  assert.equal(exploreIndexable([row],{},true),false);
});

test('Explore sitemap uses country and first-page eligibility and updates after publication or withdrawal',async()=>{
  assert.deepEqual(indexableExploreLocales([row]).sort(),['en-CA','en-CA-AB','en-CA-BC','en-CA-ON','fr-CA-QC'].sort());
  const newerTests=Array.from({length:24},(_,i)=>({...row,id:String(i),title:'TEST_'+i,published_at:'2026-10-14T00:00:00Z'}));
  assert.deepEqual(indexableExploreLocales([...newerTests,row]),[]);
  let rows=[];
  const handler=createContentFeedHandler({fetcher:async url=>Response.json(new URL(url).searchParams.has('id')?[]:rows)});
  for(const [documents,expected] of [[[],false],[[row],true],[[],false]]) {
    rows=documents;const res=response();await handler({query:{kind:'static'},headers:{}},res);
    assert.equal(res.statusCode,200);
    assert.equal(res.body.includes('<loc>https://smartjsabridge.com/en-CA/explore</loc>'),expected);
    assert.ok(!res.body.includes('<loc>https://smartjsabridge.com/en-US/explore</loc>'));
  }
});

test('retired language URLs return a real 404 instead of a duplicate English home page',()=>{
  const res=response();retiredLocale({headers:{}},res);
  assert.equal(res.statusCode,404);assert.equal(res.headers['X-Robots-Tag'],'noindex');
  assert.match(res.body,/Page not found/);assert.ok(!res.body.includes('rel="canonical"'));
});
