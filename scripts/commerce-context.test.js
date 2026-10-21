import test from 'node:test';
import assert from 'node:assert/strict';
import {contentSnapshot,extractNeeds,offerFingerprint,selectOffers} from '../server/commerce/engine.js';
import {EQUIPMENT_PURPOSES} from '../server/commerce/context-needs.js';
const categories=s=>extractNeeds(s).map(n=>n.category);
test('whole workflow includes risk controls, monitoring, communication and cleanup',()=>{
 const s=contentSnapshot('ugc',{id:'x',is_public:true,title:'밀폐 공간 탱크 내부 육안 점검',analysis_data:[{proc:{stepTitle:'입장 전 확인'},risks:[{factor:'산소 부족 및 가연성 가스',current_measure:'산소 및 가스 측정, 외부 감시자와 연락 수단 확보'}]}]});
 assert.deepEqual(s.steps[0].hazards,['산소 부족 및 가연성 가스']);
 const c=categories(s); for(const expected of ['pumped-multigas-detector','intrinsically-safe-radio','intrinsically-safe-light'])assert.ok(c.includes(expected),expected);
 for(const excluded of ['clipboard','document-holder','ordinary-two-way-radio','air-blower','portable-ventilator','particulate-respirator'])assert.ok(!c.includes(excluded),excluded);
});
test('MEWP needs a compatible harness component and tool tether, not an assumed personnel net',()=>{
 const s={title:'고소 작업대 외벽 설비 점검',body:'지정 앵커에 적합한 추락방지장치 연결. 공구 낙하방지줄 사용. 지상 유도자와 연락. 점검표 기록.'};
 const n=extractNeeds(s);assert.equal(n.find(x=>x.category==='fall-arrest-harness').constraints.configuration,'harness-only');
 assert.ok(n.some(x=>x.category==='tool-tether'));assert.ok(n.some(x=>x.category==='ordinary-two-way-radio'));
 assert.ok(!n.some(x=>['clipboard','document-holder','fall-safety-net'].includes(x.category)));
 assert.ok(categories({title:'개구부 작업',body:'인원 추락방호망 설치'}).includes('fall-safety-net'));
});
test('cleanup supplies follow the residue and environment instead of every task',()=>{
 for(const cat of ['floor-mop','floor-squeegee','waste-sack'])assert.ok(categories({title:'배관 조립',body:'작업 후 바닥 물기를 제거하고 포장재를 수거한다.'}).includes(cat),cat);
 assert.ok(categories({title:'실외 조경 정리',body:'낙엽과 잔디 찌꺼기 수거'}).includes('air-blower'));
 assert.ok(categories({title:'유압 설비 점검',body:'누유 기름을 흡착포로 수거'}).includes('oil-absorbent'));
 for(const title of ['석면 철거','가연성 분진 작업','산·알칼리 설비 청소']){
  const c=categories({title,body:'바닥 물기 제거, 포장재 수거, 낙엽 청소, 분진 집진기로 회수'});
  for(const cat of ['floor-mop','air-blower','dust-extractor'])assert.ok(!c.includes(cat),title+':'+cat);
 }
});
test('reviewed equipment requires exact manufacturer evidence, purpose, and current review',()=>{
 const now=Date.parse('2026-10-22T12:00:00Z'),checkedAt='2026-10-22T10:00:00Z',expiresAt='2026-11-10T10:00:00Z';
 const offer={id:'gas',merchantId:'m',country:'KR',title:'Reviewed detector',category:'pumped-multigas-detector',attributes:{purpose:EQUIPMENT_PURPOSES['pumped-multigas-detector']},mode:'link-only',affiliateUrl:'https://shop.example/gas',availability:'unknown',checkedAt,expiresAt};
 const review={offerFingerprint:offerFingerprint(offer),status:'approved',reviewer:'test',reviewedAt:checkedAt,validUntil:expiresAt,specificationReviewed:true,specificationSources:['https://senko.co.kr/specification.pdf']};
 const catalog={version:1,merchants:[{id:'m',enabled:true,affiliateApproved:true,displayApproved:true,linkOnlyApproved:true,countries:['KR'],linkHosts:['shop.example'],maxAgeHours:720}],offers:[offer],reviews:[review],profiles:[]};
 const select=()=>selectOffers({snapshot:{title:'밀폐공간 점검'},catalog,country:'KR',now});assert.equal(select().length,1);
 review.specificationSources=['https://senko.co.kr.evil.example/specification.pdf'];assert.equal(select().length,0);
 review.specificationSources=['https://senko.co.kr/specification.pdf'];review.specificationReviewed=false;assert.equal(select().length,0);
});

test('excluded scope never turns a general job into a confined-space purchase context',()=>{
 const c=categories({title:'플라즈마 강판 절단',body:'<h3>별도 검토가 필요한 범위:</h3><p>밀폐공간, 가연성 가스 작업은 별도 검토합니다.</p><p>집진 설비 가동</p>'});
 for(const cat of ['pumped-multigas-detector','intrinsically-safe-radio','intrinsically-safe-light','dust-extractor'])assert.ok(!c.includes(cat),cat);
});

test('floor obstacles are not water; equipment under maintenance is not a ventilation purchase',()=>{
 const c=categories({title:'고소 작업대 점검',body:'바닥 장애물을 제거하고 공구를 회수한다.'});
 assert.ok(!c.includes('floor-mop'));assert.ok(!c.includes('floor-squeegee'));
 assert.ok(!categories({title:'송풍기 V벨트 교체',body:'송풍기 점검 후 환기 확인'}).includes('portable-ventilator'));
});
