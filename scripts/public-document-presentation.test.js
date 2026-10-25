import test from 'node:test';
import assert from 'node:assert/strict';
import {parse} from 'parse5';
import {renderPublicHtml,createPublicHandler} from '../api/public-jsa.js';
import {createContentFeedHandler} from '../api/content-feed.js';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
import {publicJsaQuality,publicIndexQuality,publicJsaView,PUBLIC_INDEX_FIELDS} from '../src/utils/publicJsa.js';
import {publicDescription,publicCategoryLabel,publicDocumentSchema,contentDate} from '../src/utils/publicDocumentPresentation.js';
import {getPublicDocumentUi} from '../src/locales/publicDocumentUi.js';
const shell='<html><head></head><body><div id="root"></div></body></html>';
const id='12345678-1234-4234-8234-123456789012',author='12345678-1234-4234-8234-123456789013';
const row={id,author_id:author,title:'Valve isolation',is_public:true,public_country:'US',public_locale:'en-US',reuse_license:'community-v1',assessment:{checked:true},content_updated_at:'2026-10-19T10:00:00Z',updated_at:'2026-10-20T12:00:00Z',publication_context:{scope:'Valve replacement under isolation.'},form_data:{managerName:'PRIVATE_MANAGER',workLocation:'PRIVATE_LOCATION'},analysis_data:Array.from({length:3},(_,i)=>({proc:{stepTitle:'Step '+i,stepDetail:'Detailed authored procedure '+i+' — inspect and verify the isolation.'},risks:[{factor:'Trapped pressure',current_measure:'Verify zero pressure',recommend_measure:'Install a bleed connection',category:'고압유체/압력'}],actionPlan:{additionalControls:'Confirm the vent remains open.',owner:'PRIVATE_OWNER',verifiedBy:'PRIVATE_VERIFIER',residualFrequency:1,residualSeverity:2}}))};
const all=(n,p)=>[...(p(n)?[n]:[]),...(n.childNodes||[]).flatMap(x=>all(x,p))];
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).filter(x=>!['script','style'].includes(x.tagName)).map(text).join(' ');
const res=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(b){this.body=b;}});
test('every supported locale has reading-first HTML with an optional procedure preview, localized categories and additional controls without private fields',()=>{
 for(const locale of SUPPORTED_LANGS){
  const html=renderPublicHtml(shell,{...row,public_locale:locale},locale,false,null,{id:author,nickname:'Public author'}),tree=parse(html),body=text(tree),ui=getPublicDocumentUi(locale);
  assert.ok(body.includes(ui.procedurePreview));assert.ok(body.includes('Confirm the vent remains open.'));
  assert.ok(body.includes(publicCategoryLabel('고압유체/압력',locale)));if(locale!=='ko')assert.ok(!body.includes('고압유체/압력'));
  assert.equal(all(tree,n=>n.tagName==='h1').length,1);assert.ok(body.indexOf('Trapped pressure')<body.indexOf(ui.procedurePreview));
  const preview=all(tree,n=>n.tagName==='details'&&n.attrs.some(a=>a.name==='id'&&a.value==='public-preview-panel'))[0];
  assert.ok(preview); assert.ok(!preview.attrs.some(a=>a.name==='open'));
  assert.ok(body.includes('Public author'));assert.ok(body.includes('2026-10-19'));assert.doesNotMatch(html,/PRIVATE_MANAGER|PRIVATE_LOCATION|PRIVATE_OWNER|PRIVATE_VERIFIER/);
 }
});
test('descriptions extract authored scope and hazards; dates do not change on metric updates; schema safely matches public information',()=>{
 assert.equal(publicDescription(row),'Valve replacement under isolation. · Trapped pressure');
 assert.equal(contentDate(row),'2026-10-19T10:00:00.000Z');assert.equal(contentDate({updated_at:row.updated_at}),null);
 const schema=publicDocumentSchema(publicJsaView(row),{id:author,nickname:'Public author'},'Library');assert.equal(schema['@graph'][0].author.name,'Public author');
 assert.equal(publicDocumentSchema(row,{id:'other',nickname:'Unrelated'},'Library')['@graph'][0].author,undefined);
 const html=renderPublicHtml(shell,{...row,title:'Valve </script><script>alert(1)</script>'},'en-US',false,null,{id:author,nickname:'</script><img onerror=x>'});
 const scripts=all(parse(html),n=>n.tagName==='script');assert.equal(scripts.length,3);
 const json=scripts.find(n=>n.attrs.some(a=>a.name==='type'&&a.value==='application/ld+json'));assert.equal(JSON.parse(text(json))['@graph'][0].name,'Valve </script><script>alert(1)</script>');
});
test('lightweight discovery eligibility uses the exact same publication gates',()=>{
 const facts={titles:row.analysis_data.map(s=>s.proc.stepTitle),meaningful:800};
 for(const change of [{},{title:'TEST_document'},{assessment:{checked:false}},{assessment:{checked:true,duplicate_of:id}},{assessment:{checked:true,review:'rejected'}},{public_locale:null},{is_public:false},{reuse_license:null}])assert.equal(publicIndexQuality({...row,...change,index_facts:facts}).indexable,publicJsaQuality({...row,...change}).indexable);
 assert.equal(publicIndexQuality({...row,index_facts:{titles:['a','A','b'],meaningful:800}}).indexable,false);
});
test('sitemap requests only compact index fields and does not request full document bodies',async()=>{
 for(const kind of ['index','static','public']){
  const response=res();await createContentFeedHandler({fetcher:async url=>{const u=new URL(url);assert.ok(u.pathname.endsWith('/public_jsa_index'));const select=u.searchParams.get('select');assert.ok(select==='id'||select===PUBLIC_INDEX_FIELDS);if(select!== 'id')assert.equal(u.searchParams.get('and'),'(id.in.('+id+'))');return Response.json(u.searchParams.has('id')?[]:select==='id'?[{id}]:[{...row,analysis_data:undefined,index_facts:{titles:['a','b','c'],meaningful:800}}]);}})({query:{kind},headers:{}},response);
  assert.equal(response.statusCode,200);assert.doesNotMatch(response.body,/PRIVATE_|Detailed authored/);
 }
});
test('optional author failures never hide the document and only public author RPC is used',async()=>{
 const response=res();await createPublicHandler({readShell:async()=>shell,fetcher:async(url,options)=>{
  if(url.includes('/rpc/author_action')){assert.equal(JSON.parse(options.body).p_action,'author');throw Error('offline');}
  if(url.includes('/rpc/'))return Response.json(null);return Response.json([row]);
 }})({query:{lng:'en-US',id}},response);
 assert.equal(response.statusCode,200);assert.ok(response.body.includes('Detailed authored procedure'));
});
