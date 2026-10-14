import test from 'node:test';
import assert from 'node:assert/strict';
import { exploreQuery, exploreSearch } from '../src/utils/discovery.js';
import { publicJsaView } from '../src/utils/publicJsa.js';
import { exploreIndexable } from '../src/utils/exploreIndexing.js';
import { createExploreHandler } from '../api/explore.js';
import { getOperatorUi } from '../src/locales/operatorUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

test('operator filter survives pagination, country, tags and sort; unrecognized authors are ignored',()=>{
 const q={author:'operator',country:'KR',search:'용접',tags:['가스'],sort:'views',page:2};
 assert.deepEqual(exploreQuery(exploreSearch(q)),q);
 assert.equal(exploreQuery('?author=admin').author,undefined);
 assert.equal(exploreQuery(exploreSearch({...q,author:undefined})).author,undefined);
 assert.equal(exploreIndexable([],{author:'operator'}),false);
});
test('operator filter is applied at the database query before pagination',async()=>{
 let requested;
 const res={setHeader(){},end(body){this.body=body;}};
 const handler=createExploreHandler({readShell:async()=>'<html><head></head><body><div id="root"></div></body></html>',fetcher:async url=>{
  requested=new URL(url).searchParams;
  return {ok:true,headers:new Headers({'content-range':'24-35/36'}),json:async()=>[]};
 }});
 await handler({query:{lng:'ko',author:'operator',page:'1'}},res);
 assert.equal(res.statusCode,200);
 assert.equal(requested.get('is_operator'),'eq.true');
 assert.equal(requested.get('offset'),'24');
 assert.match(res.body,/noindex,follow/);
});
test('operator identity and document grouping only accept typed public projection fields',()=>{
 const group='10000000-0000-4000-8000-000000000001';
 const source={id:group,is_public:true,is_operator:true,document_group_id:group,document_variant:'technical',analysis_data:[{frequency:null,severity:null,riskLevel:null,proc:{stepTitle:'Check'},risks:[]}]};
 const safe=publicJsaView(source);
 assert.equal(safe.is_operator,true);
 assert.equal(safe.document_group_id,group);
 assert.equal(safe.document_variant,'technical');
 assert.equal(safe.analysis_data[0].frequency,null);
 assert.equal(publicJsaView({...source,is_operator:'true',document_group_id:'invalid',document_variant:'unknown'}).is_operator,false);
 assert.equal(publicJsaView({...source,document_group_id:'invalid'}).document_group_id,null);
});
test('all supported locales have operator, unlimited and three-version labels',()=>{
 for(const locale of SUPPORTED_LANGS){
  const ui=getOperatorUi(locale);
  assert.ok(Object.values(ui).every(value=>typeof value==='string'&&value.trim()),locale);
  assert.match(ui.used,/\{used\}/);
  assert.equal(new Set([ui.basic,ui.technical,ui.handover]).size,3);
 }
});
