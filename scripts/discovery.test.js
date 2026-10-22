import test from 'node:test';
import assert from 'node:assert/strict';
import {createExploreHandler,renderExploreHtml} from '../api/explore.js';
import {exploreQuery,exploreSearch,documentStats,riskValue} from '../src/utils/discovery.js';
import {publicJsaQuality} from '../src/utils/publicJsa.js';
import {getDiscoveryUi} from '../src/locales/discoveryUi.js';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
import {adEligible} from '../src/utils/adEligibility.js';
const shell='<html><head></head><body><div id="root"></div></body></html>';
const row={id:'10000000-0000-4000-8000-000000000001',title:'<script>hazard</script>',is_public:true,public_locale:'ko',analysis_data:[{proc:{stepTitle:'Inspect',stepDetail:'Inspect the equipment'},risks:[{factor:'Collision',category:'mechanical',measure:'Isolate',recommend_measure:'Add barrier'}]}]};
test('Explore initial HTML contains real titles, steps, escaped content and crawlable pages',()=>{
 const html=renderExploreHtml(shell,{rows:[row],total:25,hasMore:true},'ko',exploreQuery());
 assert.match(html,/Inspect the equipment|Inspect/);assert.match(html,/rel="next" href="\/ko\/explore\?page=1/);assert.match(html,/index,follow/);assert.doesNotMatch(html,/<script>hazard/);assert.match(html,/\\u003cscript/);
 assert.match(renderExploreHtml(shell,{rows:[],total:0},'ko',exploreQuery(),true),/noindex,follow/);
});
test('URL filters round-trip safely and SQL sort injection is rejected',()=>{
 const input={search:'a%_!',sort:'views',tags:['가스','quote"\\'],page:2};assert.deepEqual(exploreQuery(exploreSearch(input)),input);
 assert.equal(exploreQuery('?sort=evil&page=-99').page,0);assert.equal(exploreQuery('?sort=evil').sort,'latest');
});
test('Explore server passes pagination and tag filters and fails closed on network errors',async()=>{
 const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}});
 const queries=[];const handler=createExploreHandler({readShell:async()=>shell,fetcher:async url=>{queries.push(new URL(url).searchParams);return {ok:true,headers:new Headers({'content-range':'12-12/25'}),json:async()=>[row]};}});
 const r=response();await handler({query:{lng:'ko',page:'1',sort:'views',tag:'가스'}},r);assert.equal(r.statusCode,200);const query=queries[0];assert.equal(query.get('select'),'id');assert.equal(queries[1].get('id'),'in.('+row.id+')');assert.equal(queries[1].get('offset'),null);assert.equal(query.get('offset'),'12');assert.equal(query.get('order'),'view_count.desc,id.asc');assert.equal(query.get('tags'),'cs.{"가스"}');assert.match(r.body,/noindex/);assert.equal(r.headers['CDN-Cache-Control'],'no-store');
 const failure=response();await createExploreHandler({readShell:async()=>shell,fetcher:async()=>{throw Error('offline');}})({query:{lng:'ko'}},failure);assert.equal(failure.statusCode,503);assert.match(failure.body,/noindex/);
});
test('risk summaries do not invent values or double count legacy controls',()=>{
 assert.deepEqual(documentStats(row),{hazards:1,controls:2,categories:['mechanical']});
 for(const value of [undefined,null,'',{},'bad',-1])assert.equal(riskValue(value),null);
 assert.equal(riskValue('3'),3);assert.equal(riskValue(0),0);
});

test('Explore retries one transient read, preserving filters and real document content',async()=>{
 for(const failure of [new Error('timeout'),500,503]){
  const calls=[];
  const fetcher=async(url,options)=>{
   calls.push({url,options});
   if(calls.length===1){if(failure instanceof Error)throw failure;return new Response('unavailable',{status:failure});}
   return new Response(JSON.stringify([row]),{headers:{'content-range':'0-0/1'}});
  };
  const res={setHeader(){},end(body){this.body=body;}};
  await createExploreHandler({fetcher,readShell:async()=>shell})({query:{lng:'en-US',country:'US',tag:'mechanical'}},res);
  assert.equal(res.statusCode,200);assert.equal(calls.length,3);
  assert.equal(calls[0].url,calls[1].url);assert.notEqual(calls[0].options.signal,calls[1].options.signal);
  assert.equal(new URL(calls[1].url).searchParams.get('public_country'),'eq.US');
  assert.equal(new URL(calls[1].url).searchParams.get('tags'),'cs.{"mechanical"}');
  assert.match(res.body,/10000000-0000-4000-8000-000000000001/);
 }
});

test('Explore keeps persistent failures unavailable and never retries authorization or invalid data',async()=>{
 for(const [status,expectedCalls] of [[500,2],[503,2],[400,1],[401,1],[403,1],[429,1],[200,1]]){
  let calls=0;const res={setHeader(){},end(body){this.body=body;}};
  await createExploreHandler({readShell:async()=>shell,fetcher:async()=>{calls++;return new Response('{}',{status});}})({query:{lng:'en-US'}},res);
  assert.equal(calls,expectedCalls);assert.equal(res.statusCode,503);assert.match(res.body,/noindex,follow/);
 }
});
test('missing assessment and duplicate content cannot be indexed; unreviewed content cannot show ads',()=>{
 for(const assessment of [undefined,{checked:false},{checked:true,duplicate_of:row.id},{checked:true,review:'rejected'}])assert.equal(publicJsaQuality({...row,assessment}).indexable,false);
 const config={adsEnabled:true,contactsVerified:true,regionalReviewComplete:true,certifiedCmpConfigured:true,approvedRegions:['KR'],approvedCmpIds:[10]},consent={region:'KR',cmpId:10,ads:true,verified:true,expiresAt:2000},path='/ko/public-jsa/'+row.id;
 assert.equal(adEligible(config,consent,path,1000),false);
 for(const review of ['pending','stale','rejected'])assert.equal(adEligible(config,consent,path,1000,{indexable:true,review}),false);
 assert.equal(adEligible(config,consent,'/ko/explore',1000,{indexable:true,review:'approved'}),false);
 assert.equal(adEligible(config,consent,path,1000,{indexable:true,review:'approved'}),true);
});
test('all supported languages have complete discovery labels',()=>{
 for(const locale of SUPPORTED_LANGS)for(const [key,value] of Object.entries(getDiscoveryUi(locale)))assert.ok(typeof value==='string'&&value.trim(),locale+':'+key);
});
