import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { homePublicCards } from '../src/utils/homePublicCatalog.js';
import { readHomePublic } from '../server/home-public.js';
import { createContentIndexHandler } from '../api/content-index.js';
import { renderCaseArticle } from '../api/case-study.js';
import { sourceNoteParts } from '../src/utils/sourceNotes.js';
import { rankedAutoTags } from '../src/utils/TagDictionary.js';
import { communityHomeUi } from '../src/locales/communityHomeUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
const id=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const row=n=>({ id:id(n), title:'Public task '+n, is_public:true, public_country:'KR', public_locale:'ko',
 published_at:'2026-10-10T00:00:00Z', content_updated_at:'2026-10-11T00:00:00Z', updated_at:'2026-10-25T00:00:00Z',
 assessment:{checked:true,review:'approved'}, reuse_license:'community-v1',
 publication_context:{scope:'An authored summary of the work.'},
 form_data:{managerName:'PRIVATE_MANAGER'}, custom_layout:{documentNotes:'PRIVATE_NOTES'},
 analysis_data:[{proc:{stepTitle:'Isolation',stepDetail:'Verify isolation before maintenance.'},risks:[{factor:'Pressure',measure:'Verify zero pressure'}]}] });
const shell='<html><head></head><body><div data-live-public-list="home"></div><div data-live-case-list="home"></div></body></html>';
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}});
const all=(n,p)=>[...(p(n)?[n]:[]),...(n.childNodes||[]).flatMap(c=>all(c,p))];

test('home excludes private, restricted, rejected and known duplicate documents and collapses explicit version groups',()=>{
 const rows=[row(1),{...row(2),is_public:false},{...row(3),restricted:true},{...row(4),public_country:'US'},
 {...row(5),assessment:{review:'rejected'}},{...row(6),assessment:{duplicate_of:id(1)}},
 {...row(7),document_group_id:id(70),document_variant:'basic'},{...row(8),document_group_id:id(70),document_variant:'technical'},...Array.from({length:9},(_,i)=>row(i+10))];
 const cards=homePublicCards(rows,'ko');
 assert.deepEqual(cards.map(c=>c.id),[id(1),id(7),id(10),id(11),id(12),id(13)]);
 assert.equal(cards[1].variant,'basic');assert.equal(cards[0].date,'2026-10-11T00:00:00.000Z');
 assert.doesNotMatch(JSON.stringify(cards),/PRIVATE_|form_data|analysis_data|assessment/);
});

test('home uses bounded metadata reads, handles server caps and stops at six cards',async()=>{
 const records=Array.from({length:12},(_,i)=>row(i+1));let reads=0;
 const result=await readHomePublic('ko',async value=>{
  const u=new URL(value),p=u.searchParams; assert.ok(u.pathname.endsWith('/public_jsa_cards'));
  assert.equal(p.get('is_public'),'eq.true');assert.equal(p.get('public_country'),'eq.KR');
  assert.equal(p.get('limit'),'12');assert.doesNotMatch(p.get('select'),/form_data|analysis_data|custom_layout/);
  reads++;const offset=Number(p.get('offset'));
  return Response.json(records.slice(offset,offset+3));
 });
 assert.equal(reads,2);assert.deepEqual(result.cards.map(c=>c.id),[1,2,3,4,5,6].map(id));
});

test('live home includes real public cards and safely escaped compact bootstrap; withdrawals change the response',async()=>{
 let documents=[{...row(1),title:'Task </script><img src=x onerror=alert(1)>'}];
 const handler=createContentIndexHandler({readTemplate:async()=>shell,fetcher:async value=>{
  const u=new URL(value);if(u.pathname.endsWith('/case_studies'))return Response.json([]);
  return Response.json(documents.slice(Number(u.searchParams.get('offset') || 0)));
 }});
 let res=response();await handler({query:{lng:'ko',kind:'home'},headers:{}},res);
 assert.equal(res.statusCode,200);const tree=parse(res.body);
 assert.equal(all(tree,n=>n.tagName==='img').length,0);assert.match(res.body,/home-resource-card/);assert.doesNotMatch(res.body,/PRIVATE_/);
 const bootstrap=all(tree,n=>n.tagName==='script').map(n=>n.childNodes[0]?.value||'').find(s=>s.startsWith('window.__HOME_PUBLIC__='));
 assert.equal(JSON.parse(bootstrap.slice('window.__HOME_PUBLIC__='.length,-1)).cards[0].id,id(1));
 const etag=res.headers.ETag;documents=[];res=response();await handler({query:{lng:'ko',kind:'home'},headers:{}},res);
 assert.equal(res.statusCode,200);assert.notEqual(res.headers.ETag,etag);assert.doesNotMatch(res.body,/home-resource-card/);
});

test('public home failures do not produce a misleading successful empty catalog',async()=>{
 const handler=createContentIndexHandler({readTemplate:async()=>shell,fetcher:async value=>new URL(value).pathname.endsWith('/case_studies')?Response.json([]):new Response('unavailable',{status:503})});
 const res=response();await handler({query:{lng:'ko',kind:'home'},headers:{}},res);assert.equal(res.statusCode,503);
});

test('battery and woodworking words do not imply forestry or ladders; specific evidence still matches',()=>{
 const tags=title=>rankedAutoTags(title,[],{locale:'ko'}).map(v=>v.tag);
 assert.ok(!tags('이차전지 전극 코팅 작업').includes('벌목작업'));
 assert.ok(!tags('목공용 작업대 제작').includes('설비(사다리류)'));
 assert.ok(tags('수목 가지치기 및 전지 작업').includes('벌목작업'));
 assert.ok(tags('이동식 사다리 점검').includes('설비(사다리류)'));
});

test('article introduction precedes the numbered work without losing sources, downloads or review records',()=>{
 const html=renderCaseArticle({content_md:'<p>Authored scope</p><p>Official source</p><h2>1. Work</h2><p>Main body</p><h2>11. Review</h2><p>Review record</p>',pdf_download_url:'https://example.com/case.pdf'},'ko');
 for(const value of ['Authored scope','Official source','Main body','Review record','case.pdf'])assert.ok(html.includes(value));
 assert.ok(html.indexOf('Authored scope')<html.indexOf('1. Work'));
});

test('source notes preserve text while only linking valid HTTP sources',()=>{
 const parts=sourceNoteParts('Source: https://example.com/doc.\\nNext: javascript:alert(1) <script>x</script>');
 assert.deepEqual(parts.filter(p=>p.href).map(p=>p.href),['https://example.com/doc']);
 assert.equal(parts.map(p=>p.text).join(''),'Source: https://example.com/doc.\nNext: javascript:alert(1) <script>x</script>');
});

test('every supported locale has complete localized home navigation and copy',()=>{
 const keys=Object.keys(communityHomeUi('en-US'));
 for(const locale of SUPPORTED_LANGS){const ui=communityHomeUi(locale);for(const key of keys)assert.ok(ui[key],locale+':'+key);if(!locale.startsWith('en'))assert.notEqual(ui.title,communityHomeUi('en-US').title);}
});
