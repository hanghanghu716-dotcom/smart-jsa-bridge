import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hubQuery,officialUrl,visibleResource } from '../src/utils/resourceHub.js';
import { parseResourceFeed,collectResourceFeed } from '../src/utils/resourceFeed.js';
import { resourceHubUi,RESOURCE_UI_KEYS } from '../src/locales/resourceHubUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { searchResources } from '../src/utils/resourceSearch.js';
import { createResourceHandler,renderResourceHtml } from '../api/resource-hub.js';
const sources=JSON.parse(readFileSync(new URL('../src/data/resource-sources.json',import.meta.url)));
const future=new Date(Date.now()+86400000).toISOString();
const source={active:true,review_until:future,domains:['official.example'],commercial:false,adaptation:false};
const item={state:'published',url:'https://official.example/a',evidence_url:'https://official.example/terms',review_until:future};
test('all supported jurisdictions have their own official source and complete UI',()=>{
 for(const locale of SUPPORTED_LANGS){assert.ok(sources.some(s=>s.locales.includes(locale)),locale);const ui=resourceHubUi(locale);for(const key of RESOURCE_UI_KEYS)assert.ok(typeof ui[key]==='string'&&ui[key].length,key+locale);}
 assert.ok(sources.find(s=>s.locales.includes('fr-CA-QC')).domains.includes('www.cnesst.gouv.qc.ca'));
 assert.ok(!sources.find(s=>s.locales.includes('en-SG')).domains.includes('www.osha.gov'));
});
test('copyright publication gate fails closed on expiry, withdrawal, adaptation and unknown evidence',()=>{
 assert.equal(visibleResource(item,source),true);
 for(const patch of [{state:'pending'},{review_until:'2000-01-01'},{evidence_url:''},{summary:'adapted text'},{translated:true}])assert.equal(visibleResource({...item,...patch},source),false);
 assert.equal(visibleResource({...item,translated:true,reuse_confirmed:true,attribution:'Licensed translated title.'},{...source,adaptation:true,commercial:false}),false);
 assert.equal(visibleResource(item,{...source,active:false}),false);
 assert.equal(visibleResource(item,{...source,review_until:'2000-01-01'}),false);
 assert.equal(visibleResource({...item,summary:'permitted summary',attribution:'Official source, licensed adaptation.',reuse_confirmed:true},{...source,commercial:true,adaptation:true}),true);
});
test('official URLs reject credentials, schemes, redirects to foreign domains and malformed authority',()=>{
 for(const u of ['http://official.example/a','https://official.example@evil.test/a','https://official.example.evil.test/a','https://official.example:443/a','javascript:alert(1)','https://127.0.0.1/a','https://official.example\\@evil.test/a'])assert.equal(officialUrl(u,source.domains),null,u);
});
test('feed collector retains only bounded title, link and publication date; no bodies or victim details',()=>{
 const xml='<rss><channel><item><title>Official &amp; notice</title><link>https://official.example/a</link><description>private victim information</description><content:encoded>copied body</content:encoded><pubDate>Tue, 27 Oct 2026 12:00:00 GMT</pubDate></item><item><title>Offsite</title><link>https://evil.test/a</link></item></channel></rss>';
 assert.deepEqual(parseResourceFeed(xml,source),[{title:'Official & notice',url:'https://official.example/a',source_date:'2026-10-27'}]);
 assert.throws(()=>parseResourceFeed('<!DOCTYPE x [<!ENTITY x "a">]><rss/>',source),/UNSAFE/);
});
test('feed collection never follows redirects or reads unbounded input',async()=>{
 await assert.rejects(collectResourceFeed({...source,feed_url:'https://official.example/rss'},async(u,options)=>{assert.equal(options.redirect,'manual');return new Response('',{status:302,headers:{Location:'https://127.0.0.1/'}});}),/UNAVAILABLE/);
 await assert.rejects(collectResourceFeed({...source,feed_url:'https://official.example/rss'},async()=>new Response('a'.repeat(1024*1024+1),{headers:{'Content-Type':'application/xml'}})),/TOO_LARGE/);
});
test('unified search only queries public metadata, exact Case Study locale and selected country',async()=>{
 const calls=[];const result=await searchResources('en-SG',hubQuery('?q=lift&type=all'),async(t,p)=>{calls.push([t,p]);return [];},async()=>({items:[],has_more:false}));
 assert.equal(result.groups.length,4);assert.equal(calls[0][0],'public_jsa_cards');assert.equal(calls[0][1].public_country,'eq.SG');assert.equal(calls[1][1].language_code,'in.(en-SG)');
 for(const [,p]of calls){assert.ok(Number(p.limit)<=13);assert.ok(!/form_data|analysis_data|pdf/.test(p.select));}
});
test('resource HTML includes approved readable text, escapes source text and does not index search pages',()=>{
 const html=renderResourceHtml('<html lang="en"><head></head><body><div id="root"></div></body></html>','en-US','resources',hubQuery(),{items:[{id:'x',url:'https://official.example/a',title:'<script>bad</script>',summary:'Reviewed summary',source:'Official',locale:'en-US',topic:'general',kind:'news',checked_at:'2026-10-27'}],sources:[],has_more:false});
 assert.ok(html.includes('Reviewed summary'));assert.ok(html.includes('noindex,follow'));assert.ok(!html.includes('<script>bad</script>'));assert.ok(html.includes('__RESOURCE_HUB__'));
});
test('database failures return 503 instead of a misleading empty resource page',async()=>{
 const r={headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v;}};
 await createResourceHandler({fetcher:async()=>new Response('',{status:500}),readShell:async()=>''})({method:'GET',query:{lng:'en-US'},headers:{}},r);
 assert.equal(r.statusCode,503);assert.ok(r.headers['X-Robots-Tag'].includes('noindex'));
});
