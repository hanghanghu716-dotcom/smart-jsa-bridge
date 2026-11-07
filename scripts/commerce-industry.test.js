import test from 'node:test';
import assert from 'node:assert/strict';
import { extractNeeds, selectOffers, offerFingerprint, fingerprint } from '../server/commerce/engine.js';
import { INDUSTRY_PURPOSES } from '../server/commerce/industry-needs.js';
const cats=s=>extractNeeds(s).map(n=>n.category);
const dairy={kind:'ugc',id:'any-id',locale:'ko',title:'HTST 우유 살균기 판형열교환기 복구',steps:[
 {title:'전열판 개방',detail:'위생면을 적합한 공구로 세척한다.',controls:[['차단점 잠금·표지, 접근을 통제한다.']]},
 {title:'정비 후 위생 확보',detail:'CIP 세척과 제품 접촉부 위생처리. 지정 조건과 헹굼 종말점을 확인한다.'},
]};
test('food hygiene complements maintenance controls for arbitrary IDs and both content sources',()=>{
 for(const s of [dairy,{...dairy,id:'different'}, {kind:'case',title:dairy.title,body:'<table><tr><td>전열판 개방 후 위생면 세척. 차단점 잠금·표지. 접근을 통제. CIP 세척과 제품 접촉부 위생처리.</td></tr></table>'}]){
  const result=cats(s);
  for(const c of ['food-hygiene-clothing','food-hair-cover','food-cleaning-brush','food-equipment-sanitizer','food-cip-cleaner','lockout-tag','barrier-tape'])assert.ok(result.includes(c),c);
  for(const c of ['waste-sack','floor-mop','cleaning-cloth'])assert.ok(!result.includes(c),c);
 }
});
test('industry matching covers food processes beyond milk and generic titles with real process scope',()=>{
 for(const title of ['음료 충전라인 세척','식품 포장설비 위생 점검','제빵 설비 위생 복구','Dairy processing equipment cleaning','Beverage line hygiene maintenance']){
  assert.ok(cats({title}).includes('food-hygiene-clothing'),title);
 }
 assert.ok(cats({title:'열교환기 복구',scope:'우유 생산 구역',steps:[{detail:'위생면 세척'}]}).includes('food-hair-cover'));
});
test('hygiene mentions do not conflate pharmaceutical, semiconductor and ordinary maintenance work with food',()=>{
 for(const title of ['무균 바이알 충전라인 복구','반도체 습식 식각조 복구','병원 소독 설비','일반 배관 세척','정수기 세척']){
  assert.ok(!cats({title,body:'살균, CIP 세척과 위생 처리.'}).some(c=>c.startsWith('food-')),title);
 }
 assert.ok(!cats({title:'우유 배송차 타이어 교체',body:'차량 잠금·표지.'}).some(c=>c.startsWith('food-')));
 assert.ok(!cats({title:'펌프 점검',body:'<h3>제외 범위:</h3><p>식품 공정 CIP 세척.</p><p>차단점 잠금·표지.</p>'}).some(c=>c.startsWith('food-')));
});
test('CIP is not a brush request, thermal pasteurization is not a chemical disinfection request',()=>{
 assert.ok(!cats({title:'우유 살균기 CIP 세척'}).includes('food-cleaning-brush'));
 assert.ok(!cats({title:'우유 열 살균기 위생 점검'}).includes('food-equipment-sanitizer'));
 assert.ok(cats({title:'식품 설비 수작업 세척'}).includes('food-cleaning-brush'));
 assert.ok(!cats({title:'식품 설비 위생 점검',body:'수작업 세척은 불필요하다. 소독제 사용 금지.'}).includes('food-equipment-sanitizer'));
 assert.ok(!cats({title:'식품 설비 위생 점검',body:'위생복 착용하지 않는다.'}).includes('food-hygiene-clothing'));
});

function fixture(categories){
 const checkedAt='2026-10-22T00:00:00Z',expiresAt='2026-11-10T00:00:00Z';
 const offers=categories.map(category=>({id:category,title:'TEST '+category,category,merchantId:'m',country:'KR',mode:'link-only',availability:'unknown',checkedAt,expiresAt,affiliateUrl:'https://shop.example/'+category,attributes:INDUSTRY_PURPOSES[category]?{purpose:INDUSTRY_PURPOSES[category]}:{}}));
 const source=category=>category==='food-hair-cover'?'https://www.palinternational.com/spec':category==='food-cleaning-brush'?'https://www.vikan.com/spec':category==='food-hygiene-clothing'?'https://www.portwest.com/spec':'https://www.ecolab.com/spec';
 return {version:1,merchants:[{id:'m',enabled:true,affiliateApproved:true,displayApproved:true,linkOnlyApproved:true,countries:['KR'],linkHosts:['shop.example'],maxAgeHours:720}],offers,
  reviews:offers.map(o=>({offerFingerprint:offerFingerprint(o),status:'approved',reviewer:'TEST',reviewedAt:checkedAt,validUntil:expiresAt,specificationReviewed:true,specificationSources:[source(o.category)],countryUseReviewed:true,labelUseReviewed:true})),profiles:[]};
}
const select=(catalog,snapshot=dairy)=>selectOffers({snapshot,catalog,country:'KR',now:Date.parse('2026-10-22T12:00:00Z')});
test('reviewed food hygiene items rank ahead of generic marking; catalogue gaps do not fabricate offers',()=>{
 const catalog=fixture(['lockout-tag','barrier-tape','food-hygiene-clothing','food-hair-cover','food-cleaning-brush']);
 assert.deepEqual(select(catalog).map(i=>i.category),['food-hygiene-clothing','food-hair-cover','food-cleaning-brush','lockout-tag','barrier-tape']);
 catalog.offers=[];assert.deepEqual(select(catalog),[]);
});
test('food products retain exact purpose, manufacturer evidence and fingerprint review requirements',()=>{
 const catalog=fixture(['food-hygiene-clothing']);
 assert.equal(select(catalog).length,1);
 catalog.reviews[0].specificationSources=['https://www.portwest.com.evil.example/spec'];assert.equal(select(catalog).length,0);
 catalog.reviews[0].specificationSources=['https://www.portwest.com/spec'];
 catalog.offers[0].attributes.purpose='non-hazardous-dry-contamination';assert.equal(select(catalog).length,0);
});
test('process chemicals need current exact-content, exact-offer compatibility review in addition to product evidence',()=>{
 for(const category of ['food-equipment-sanitizer','food-cip-cleaner']){
  const catalog=fixture([category]),o=catalog.offers[0],r=catalog.reviews[0];
  assert.equal(select(catalog).length,0);
  const profile={sourceFingerprint:fingerprint(dairy),status:'approved',reviewer:'TEST',reviewedAt:o.checkedAt,validUntil:o.expiresAt,needs:extractNeeds(dairy),processApprovals:[{offerFingerprint:offerFingerprint(o),materialCompatibilityReviewed:true,processConditionsReviewed:true}]};
  catalog.profiles=[profile];assert.equal(select(catalog).length,1);
  assert.equal(select(catalog,{...dairy,title:dairy.title+' changed'}).length,0);
  profile.processApprovals[0].materialCompatibilityReviewed=false;assert.equal(select(catalog).length,0);
  profile.processApprovals[0].materialCompatibilityReviewed=true;r.countryUseReviewed=false;assert.equal(select(catalog).length,0);
  r.countryUseReviewed=true;profile.validUntil='2026-10-21';assert.equal(select(catalog).length,0);
 }
});
test('approved suppression and profile needs remain authoritative',()=>{
 const catalog=fixture(['food-hygiene-clothing','lockout-tag']);const o=catalog.offers[0];
 const profile={sourceFingerprint:fingerprint(dairy),status:'approved',reviewer:'TEST',reviewedAt:o.checkedAt,validUntil:o.expiresAt,needs:[{category:'lockout-tag',constraints:{}}]};
 catalog.profiles=[profile];assert.deepEqual(select(catalog).map(i=>i.category),['lockout-tag']);
 profile.suppress=true;assert.deepEqual(select(catalog),[]);
});
