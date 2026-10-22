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


test('Korean isolation and boundary controls work across case and public JSA formats',()=>{
 for(const phrase of ['잠금·표지','잠금 및 표지','잠금과 표지','잠금/표지','LOTO']){
  const instruction=phrase+' 시행. 접근을 통제해 서서히 가압한다.';
  const snapshots=[
   {kind:'case',title:'설비 복구',body:'<table><tr><td>'+instruction+'</td></tr></table>'},
   {kind:'ugc',title:'설비 복구',steps:[{controls:[[instruction]]}]},
  ];
  for(const snapshot of snapshots){
   const result=categories(snapshot);
   assert.ok(result.includes('lockout-tag'),phrase);
   assert.ok(result.includes('barrier-tape'),phrase);
  }
 }
 for(const body of ['잠금·표지는 불필요하다. 접근 통제 불필요.','접근을 통제하지 않는다. 잠금 및 표지를 하지 않는다.']){
  const result=categories({title:'일반 점검',body});
  assert.ok(!result.includes('lockout-tag'));assert.ok(!result.includes('barrier-tape'));
 }
});

test('sanitary and chemical workflows do not turn fragments or residue into ordinary waste sacks',()=>{
 const examples=[
  {title:'HTST 우유 살균기 판형열교환기 복구',body:'차단점 잠금·표지. MSDS에 맞춰 환기·장갑을 선정. 파편을 회수하고 잔재를 수거한다. 접근을 통제해 가압한다.'},
  {title:'도료 비드밀 분리기 복구',body:'접착제와 유기용제 잔재를 수거한다. 잠금 및 표지.'},
  {title:'식품 이송라인 점검',body:'세척수 제거와 폐기물 수거.'},
  {title:'일반 설비 교체',body:'화학물질 오염 폐기물 수거. 바닥 물기 제거.'},
 ];
 for(const snapshot of examples){
  const result=categories(snapshot);
  for(const category of ['waste-sack','floor-mop','floor-squeegee'])assert.ok(!result.includes(category),snapshot.title+':'+category);
 }
 assert.ok(categories(examples[0]).includes('lockout-tag'));
 assert.ok(categories(examples[0]).includes('barrier-tape'));
 assert.ok(categories({title:'일반 배관 조립',body:'깨끗한 포장재 수거'}).includes('waste-sack'));
});

test('dust extraction requires explicit portable tool control, not a machine component mention',()=>{
 for(const title of ['풍력발전기 요 구동계통 복구','교량 받침 교체','원유 증류탑 점검','설탕 이송설비 집진기 정비']){
  assert.ok(!categories({title,body:'집진설비 상태 확인. 분진을 제거한다.'}).includes('dust-extractor'),title);
 }
 assert.ok(categories({title:'목재 샌딩',body:'샌더에 집진기를 연결한다.'}).includes('dust-extractor'));
 assert.ok(!categories({title:'목재 샌딩',body:'휴대용 집진기 사용하지 않는다.'}).includes('dust-extractor'));
 assert.ok(!categories({title:'금속 샌딩',body:'이동식 집진기 사용. 가연성 알루미늄 분진.'}).includes('dust-extractor'));
});
