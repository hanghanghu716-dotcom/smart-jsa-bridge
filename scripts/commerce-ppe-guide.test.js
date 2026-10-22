import test from 'node:test';
import assert from 'node:assert/strict';
import { selectOffers, selectPpeGuideOffers, offerFingerprint } from '../server/commerce/engine.js';
import { PPE_PURPOSES } from '../server/commerce/ppe-needs.js';
import { routeNeeds } from '../server/commerce/route-needs.js';
import { PPE_GROUPS, filterPpeProducts, normalizePpeGroup } from '../src/data/ppeGroups.js';
import { getPpeGuideUi } from '../src/locales/ppeGuideUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { createCommerceHandler } from '../api/commerce.js';

const now=Date.parse('2026-10-22T00:00:00Z');
function fixture(){
 const checkedAt='2026-10-21T00:00:00Z',expiresAt='2026-11-01T00:00:00Z';
 const offers=Array.from({length:12},(_,i)=>({id:String(i),merchantId:'test',country:'KR',mode:'link-only',availability:'unknown',title:'TEST goggles '+i,category:'safety-goggles',attributes:{purpose:PPE_PURPOSES['safety-goggles']},affiliateUrl:'https://test.example/'+i,imageUrl:'https://image.example/'+i+'.jpg',checkedAt,expiresAt}));
 return {version:1,profiles:[],merchants:[{id:'test',enabled:true,affiliateApproved:true,displayApproved:true,linkOnlyApproved:true,countries:['KR'],linkHosts:['test.example'],imageHosts:['image.example'],maxAgeHours:720}],offers,reviews:offers.map(o=>({offerFingerprint:offerFingerprint(o),status:'approved',reviewer:'test reviewer',reviewedAt:checkedAt,validUntil:expiresAt,specificationReviewed:true,specificationSources:['https://www.3m.co.kr/test-only-fixture']}))};
}
test('PPE guide lists multiple models while content recommendations retain their per-category cap',()=>{
 const catalog=fixture();
 assert.equal(selectPpeGuideOffers({catalog,country:'KR',locale:'ko',now}).length,12);
 assert.equal(selectOffers({catalog,country:'KR',snapshot:{kind:'case',locale:'ko',title:'고글을 사용한 점검',body:'보안경 고글 착용'},now}).length,1);
 assert.equal(selectPpeGuideOffers({catalog,country:'US',locale:'en-US',now}).length,0);
});
test('guide uses product expiry, merchant permission and exact-spec review gates',()=>{
 for(const mutate of [c=>c.merchants[0].enabled=false,c=>c.reviews.forEach(r=>r.specificationReviewed=false),c=>c.offers.forEach(o=>o.expiresAt='2026-10-20'),c=>c.reviews.forEach(r=>r.specificationSources=['https://www.3m.co.kr.evil.example/item'])]){
  const c=fixture();mutate(c);assert.deepEqual(selectPpeGuideOffers({catalog:c,country:'KR',locale:'ko',now}),[]);
 }
 const items=selectPpeGuideOffers({catalog:fixture(),country:'KR',locale:'ko',now});
 assert.ok(items.every(x=>x.group==='eyes-face'&&!('attributes'in x)&&!('score'in x)&&!('reviewer'in x)));
});
test('guide does not admit accessories or silently bypass changed specifications',()=>{
 const c=fixture();c.offers[0].category='clipboard';c.offers[1].attributes.purpose='changed';
 assert.equal(selectPpeGuideOffers({catalog:c,country:'KR',locale:'ko',now}).length,10);
});
test('all eight guide filters combine with product search and preserve empty categories',()=>{
 assert.equal(PPE_GROUPS.length,8);assert.equal(normalizePpeGroup('nonsense'),'all');
 const items=[{category:'safety-helmet',title:'3M G3000',merchant:'쿠팡'},{category:'safety-goggles',title:'3M 334AF',merchant:'쿠팡'},{category:'earplugs',title:'1100',merchant:'쿠팡'}];
 assert.equal(filterPpeProducts(items,'eyes-face',' ３Ｍ ').length,1);
 assert.equal(filterPpeProducts(items,'head','334').length,0);
 assert.equal(filterPpeProducts(items,'feet').length,0);
 assert.equal(filterPpeProducts(items,'all','쿠팡').length,3);
 for(const locale of SUPPORTED_LANGS)for(const value of Object.values(getPpeGuideUi(locale)))assert.ok(value.trim());
});
const res=()=>({setHeader(){},end(body){this.body=JSON.parse(body);}});
test('only the known static guide route reads the catalogue, without public document access',async()=>{
 let catalogReads=0;
 const handler=createCommerceHandler({env:{JSA_COMMERCE_ENABLED:'true'},reader:()=>assert.fail('guide must not query documents'),catalogReader:async()=>{catalogReads++;return fixture();},now:()=>now});
 const r=res();await handler({method:'GET',query:{kind:'guide',id:'protectiveequipment',locale:'ko'}},r);
 assert.equal(r.statusCode,200);assert.equal(r.body.items.length,12);
 const invalid=res();await handler({method:'GET',query:{kind:'guide',id:'private-document',locale:'ko'}},invalid);
 assert.equal(invalid.statusCode,400);assert.equal(catalogReads,1);
});
const route=body=>routeNeeds({title:'현장 작업 동선',body}).map(n=>n.category);
test('movement alone and explicitly absent obstacles do not create a generic shopping bundle',()=>{
 assert.deepEqual(route('작업자가 통로로 이동하여 점검 후 돌아온다.'),[]);
 assert.deepEqual(route('통로에 전선이나 호스 없음.'),[]);
 assert.deepEqual(route('보행로 방향 안내표지 불필요.'),[]);
});
test('route products follow crossing, traffic, visibility and housekeeping evidence',()=>{
 assert.ok(route('전선이 통로를 가로지르므로 걸림을 방지한다.').includes('pedestrian-cable-cover'));
 const traffic=route('지게차와 보행자가 출입구에서 교차한다. 케이블이 통로를 가로지른다. 모퉁이 사각지대 시야 불량.');
 for(const type of ['vehicle-cable-protector','pedestrian-barrier','corner-mirror'])assert.ok(traffic.includes(type));
 assert.ok(!traffic.includes('pedestrian-cable-cover'));
 const clean=route('통로 바닥 라인테이프 표시. 젖은 바닥에 미끄럼 주의 표지를 설치한다. 우회 동선 방향 안내.');
 for(const type of ['floor-marking-tape','wet-floor-sign','direction-sign'])assert.ok(clean.includes(type));
});
test('ordinary route lighting and wheeled carts are excluded from incompatible contexts',()=>{
 assert.ok(route('어두운 통로에 조명이 필요하다.').includes('portable-work-light'));
 assert.ok(!route('가연성 가스 위험구역. 어두운 통로에 조명이 필요하다.').includes('portable-work-light'));
 assert.ok(!route('자재 카트를 이용한다. 계단으로 운반한다.').includes('material-cart'));
});
