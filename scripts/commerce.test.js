import { parseCatalog, loadCatalog } from '../server/commerce/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { contentSnapshot, fingerprint, offerFingerprint, selectOffers, purchaseCountry, safeLink } from '../server/commerce/engine.js';
import { parseCsv, refreshCatalog, normalizeFeed, downloadFeed } from '../server/commerce/ingest.js';
import { createCommerceHandler } from '../api/commerce.js';
import { getCommerceUi, COMMERCE_COUNTRIES } from '../src/locales/commerceUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

const now=Date.parse('2026-10-21T12:00:00Z'), past='2026-10-21T11:00:00Z', future='2026-10-22T11:00:00Z';
const row={id:'11111111-1111-4111-8111-111111111111',is_public:true,public_locale:'en-US',title:'Use a clipboard',form_data:{},analysis_data:[]};
const snapshot=contentSnapshot('ugc',row);
function fixture(){
 const merchants=['a','b'].map(id=>({id,name:id,enabled:true,affiliateApproved:true,displayApproved:true,countries:['US'],linkHosts:[id+'.example'],maxAgeHours:12}));
 const offers=['a','b'].map(merchantId=>({id:'1',merchantId,country:'US',title:'Clipboard',category:'clipboard',attributes:{},affiliateUrl:'https://'+merchantId+'.example/product?affiliate=test',availability:'in_stock',checkedAt:past,expiresAt:future}));
 return {version:1,merchants,offers,reviews:offers.map(offer=>({offerFingerprint:offerFingerprint(offer),status:'approved',reviewer:'operator',reviewedAt:past,validUntil:future})),profiles:[]};
}
const select=catalog=>selectOffers({catalog,snapshot,country:'US',now});
test('one country can receive multiple approved merchants; country is independent of locale',()=>{
 assert.deepEqual(select(fixture()).map(x=>x.merchantId),['a','b']);
 assert.equal(purchaseCountry('ko','US'),'US');
 assert.equal(purchaseCountry('fr-CA-QC'),'CA');
 assert.equal(purchaseCountry('ko','ZZ'),null);
 assert.deepEqual(selectOffers({catalog:fixture(),snapshot,country:'KR',now}),[]);
});
test('merchant approval, availability, expiry and tracking host each independently exclude an offer',()=>{
 for(const mutate of [
  c=>c.merchants[0].enabled=false,c=>c.merchants[0].affiliateApproved=false,c=>c.merchants[0].displayApproved=false,
  c=>c.offers[0].availability='out_of_stock',c=>c.offers[0].expiresAt=past,
  c=>c.offers[0].checkedAt='2026-10-20T11:00:00Z',c=>c.reviews[0].validUntil=past,
  c=>c.merchants[0].linkHosts=['another.example'],c=>c.offers[0].checkedAt=future,
 ]){const c=fixture();mutate(c);assert.deepEqual(select(c).map(x=>x.merchantId),['b']);}
});
test('changing an approved URL, title or specification invalidates review',()=>{
 for(const key of ['title','affiliateUrl','attributes']){
  const c=fixture();c.offers[0][key]=key==='attributes'?{material:'changed'}:'changed';assert.equal(select(c).length,1);
 }
});
test('unsafe and deceptive URLs never pass exact-host validation',()=>{
 for(const url of ['javascript:alert(1)','http://a.example','https://a.example.evil.test','https://evil.test/a.example','https://name:secret@a.example','https://a.example:444']){
  assert.equal(safeLink(url,['a.example']),null);
 }
});
test('merchant diversity is capped and commissions do not affect ranking',()=>{
 const c=fixture();c.offers.push(...[2,3,4].map(id=>({...c.offers[0],id:String(id),affiliateUrl:'https://a.example/product/'+id,commission:999})));
 c.reviews=c.offers.map(o=>({...c.reviews[0],offerFingerprint:offerFingerprint(o)}));
 const result=select(c);assert.equal(result.filter(x=>x.merchantId==='a').length,2);assert.ok(result.some(x=>x.merchantId==='b'));
 assert.equal('commission' in result[0],false);assert.equal('score' in result[0],false);
});
test('PPE needs exact reviewed requirements and separately reviewed offers',()=>{
 const c=fixture();c.offers[0].category='respirator';c.offers[0].attributes={standard:'TEST-ONLY',filter:'TEST-P3'};
 c.reviews[0].offerFingerprint=offerFingerprint(c.offers[0]);
 c.profiles=[{sourceFingerprint:fingerprint(snapshot),status:'approved',reviewer:'specialist',reviewedAt:past,validUntil:future,needs:[{category:'respirator',constraints:{standard:'TEST-ONLY',filter:'TEST-P3'}}]}];
 assert.equal(select(c).length,0);
 c.reviews[0].safetyReviewed=true;assert.equal(select(c).length,1);
 c.profiles[0].needs[0].constraints.filter='DIFFERENT';assert.equal(select(c).length,0);
 c.profiles[0].needs[0].constraints={};assert.equal(select(c).length,0);
});
test('content edits invalidate safety profiles and withdrawn UGC is unavailable',()=>{
 const c=fixture();c.profiles=[{sourceFingerprint:fingerprint(snapshot),status:'approved',reviewer:'reviewer',reviewedAt:past,validUntil:future,suppress:true}];
 assert.deepEqual(select(c),[]);
 assert.equal(selectOffers({catalog:c,snapshot:{...snapshot,title:'Changed clipboard'},country:'US',now}).length,2);
 assert.equal(contentSnapshot('ugc',{...row,is_public:false}),null);
 assert.equal(contentSnapshot('ugc',{...row,restricted:true}),null);
 const c2=fixture();c2.offers[0].category='respirator';c2.offers[0].attributes={standard:'TEST'};
 c2.reviews[0]={...c2.reviews[0],offerFingerprint:offerFingerprint(c2.offers[0]),safetyReviewed:true};
 c2.profiles=[{sourceFingerprint:fingerprint(snapshot),status:'approved',reviewer:'reviewer',reviewedAt:past,validUntil:future,needs:[{category:'respirator',constraints:{standard:'TEST'}}]}];
 assert.equal(select(c2).length,1);
 assert.equal(selectOffers({catalog:c2,snapshot:{...snapshot,title:'Updated respirator case'},country:'US',now}).length,0);
});
test('content snapshot excludes participant details and unrelated fields',()=>{
 const value=contentSnapshot('ugc',{...row,form_data:{participants:['PRIVATE'],ppe:[]},private_note:'PRIVATE'});
 assert.ok(!JSON.stringify(value).includes('PRIVATE'));
});
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=JSON.parse(body);}};}
test('API rechecks public visibility on every request and never returns a cached withdrawal',async()=>{
 let visible=true,reads=0;
 const handler=createCommerceHandler({env:{JSA_COMMERCE_ENABLED:'true'},reader:async(table,params)=>{
  reads++;assert.equal(table,'public_jsa_catalog');assert.equal(params.is_public,'eq.true');return visible?[row]:[];
 },catalogReader:async()=>fixture(),now:()=>now});
 const request={method:'GET',query:{kind:'ugc',id:row.id,locale:'en-US'}};
 const first=response();await handler(request,first);assert.equal(first.body.items.length,2);
 visible=false;const second=response();await handler(request,second);assert.equal(second.statusCode,404);assert.deepEqual(second.body.items,[]);
 assert.equal(reads,2);assert.equal(first.headers['Cache-Control'],'private, no-store');
});
test('API is off by default; rejects malformed inputs; isolates provider outages',async()=>{
 const disabled=response();await createCommerceHandler({env:{},reader:()=>assert.fail('must not read')})({method:'GET'},disabled);assert.equal(disabled.body.status,'disabled');
 const handler=createCommerceHandler({env:{JSA_COMMERCE_ENABLED:'true'},reader:async()=>[row],catalogReader:async()=>{throw Error('private upstream details');}});
 for(const query of [{kind:'ugc',id:'-'.repeat(36),locale:'en-US'},{kind:'ugc',id:row.id,locale:'en-US',country:'ZZ'},{kind:['ugc'],id:row.id,locale:'en-US'}]){
  const res=response();await handler({method:'GET',query},res);assert.equal(res.statusCode,400);
 }
 const res=response();await handler({method:'GET',query:{kind:'ugc',id:row.id,locale:'en-US'}},res);assert.equal(res.statusCode,503);assert.ok(!JSON.stringify(res.body).includes('private upstream'));
});
test('trusted purchase geography can default country, explicit choice wins, untrusted headers ignored',async()=>{
 for(const [env,explicit,expected] of [[{VERCEL:'1'},undefined,'US'],[{VERCEL:'1'},'KR','KR'],[{},undefined,'KR']]){
  const handler=createCommerceHandler({env:{...env,JSA_COMMERCE_ENABLED:'true'},reader:async()=>[row],catalogReader:async()=>fixture(),now:()=>now});
  const res=response();await handler({method:'GET',headers:{'x-vercel-ip-country':'US'},query:{kind:'ugc',id:row.id,locale:'ko',...(explicit?{country:explicit}:{})}},res);assert.equal(res.body.country,expected);
 }
});
test('CSV supports quoted delimiters, newlines, escaped quotes and BOM',()=>{
 assert.deepEqual(parseCsv('\uFEFFid,title\r\n1,"A, B"\r\n2,"Line\n""quote"""'),[{id:'1',title:'A, B'},{id:'2',title:'Line\n"quote"'}]);
 assert.throws(()=>parseCsv('id,title\n1,"unclosed'));assert.throws(()=>parseCsv('id,id\n1,2'));
});
const feed={id:'feed-a',merchantId:'a',country:'US',format:'json',fields:{id:'sku',title:'name',category:'type',affiliateUrl:'url',availability:'stock'},categories:{office:'clipboard'},inStockValues:['yes']};
const raw=[{sku:'1',name:'Clipboard',type:'office',url:'https://a.example/product?affiliate=test',stock:'yes'}];
test('feed normalizes only known categories, stock and hosts; cannot import approval',()=>{
 const merchant=fixture().merchants[0];
 assert.equal(normalizeFeed(raw,feed,merchant,now).length,1);
 for(const patch of [{stock:'unknown'},{type:'unknown'},{url:'https://evil.example'}])assert.equal(normalizeFeed([{...raw[0],...patch}],feed,merchant,now).length,0);
 assert.equal('reviewer' in normalizeFeed([{...raw[0],reviewer:'malicious'}],feed,merchant,now)[0],false);
});
test('failed merchant feed disappears while healthy merchants refresh; no stale offers reused',async()=>{
 const governance=fixture();const config={version:1,feeds:[feed,{...feed,id:'feed-b',merchantId:'b'}]};
 const result=await refreshCatalog({config,governance,now,loadFeed:async f=>{if(f.merchantId==='b')throw Error('outage');return JSON.stringify(raw);}});
 assert.equal(result.catalog.offers.length,1);assert.deepEqual(result.failedFeeds,['feed-b']);
 assert.deepEqual(result.catalog.reviews,governance.reviews);
});
test('feed downloader blocks disallowed and non-HTTPS endpoints before network access',async()=>{
 for(const url of ['http://a.example/feed','https://evil.example/feed','https://user:pass@a.example/feed']){
  await assert.rejects(downloadFeed({urlEnv:'URL',allowedHosts:['a.example']},{URL:url},()=>assert.fail('must not fetch')));
 }
});
test('every site locale has commerce copy and a supported purchase country',()=>{
 for(const locale of SUPPORTED_LANGS){assert.ok(getCommerceUi(locale).disclosure);assert.ok(COMMERCE_COUNTRIES.includes(purchaseCountry(locale)));}
});

test('catalog parser bounds rows and bytes and requires all governance collections',()=>{
 assert.equal(parseCatalog(JSON.stringify(fixture())).version,1);
 assert.throws(()=>parseCatalog(JSON.stringify({version:1,offers:[]})));
 assert.throws(()=>parseCatalog(JSON.stringify({...fixture(),offers:Array(5001).fill({})})));
 assert.throws(()=>parseCatalog(' '.repeat(2000001)));
});
test('catalog remote URL is allowlisted, never follows redirects and uses no-store',async()=>{
 await assert.rejects(loadCatalog({env:{JSA_COMMERCE_CATALOG_URL:'https://evil.example/catalog',JSA_COMMERCE_CATALOG_HOST:'trusted.example'},fetcher:()=>assert.fail('must not fetch')}));
 const result=await loadCatalog({env:{JSA_COMMERCE_CATALOG_URL:'https://trusted.example/catalog',JSA_COMMERCE_CATALOG_HOST:'trusted.example'},fetcher:async(url,options)=>{
  assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
  return new Response(JSON.stringify(fixture()),{headers:{'content-type':'application/json'}});
 }});
 assert.equal(result.offers.length,2);
});
