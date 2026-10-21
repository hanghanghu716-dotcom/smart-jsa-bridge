import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPpeNeeds, PPE_PURPOSES } from '../server/commerce/ppe-needs.js';
import { offerFingerprint, selectOffers } from '../server/commerce/engine.js';
const categories=s=>extractPpeNeeds(s).map(n=>n.category);
test('PPE follows explicit content and structured UGC needs, with task-specific clothing',()=>{
 assert.deepEqual(categories({title:'자재 취급',ppe:['보안경','장갑','귀마개']}),['safety-glasses','earplugs','work-gloves']);
 assert.ok(categories({title:'지상 벽면 수성페인트 롤러 도장',body:'장갑·눈 보호. 화기 사용 금지.'}).includes('protective-coverall'));
 assert.ok(!categories({title:'도장·유기용제 철재 보수도장',ppe:['분진복']}).includes('protective-coverall'));
 assert.ok(categories({title:'세정제 청소',body:'눈 보호'}).includes('safety-goggles'));
 assert.ok(!categories({title:'용접',ppe:['보안경']}).includes('safety-glasses'));
});
test('general gloves are not inferred for rotating machines, chemical, cut, heat or electrical tasks',()=>{
 for(const title of ['드릴프레스 금속판 가공','용접 작업','세정제 청소','칼 식재료 손질','활선 패널 점검','냉동창고','회전체 정비','가연성 가스 누설 점검'])
  assert.ok(!categories({title,ppe:['장갑']}).includes('work-gloves'),title);
 assert.ok(!categories({title:'재료 취급',ppe:['장갑'],body:'운전 중 장갑 제거'}).includes('work-gloves'));
});
test('negative respirator mentions and oxygen/gas hazards never recommend a particulate-only mask',()=>{
 for(const body of ['방진마스크는 유해가스 보호 수단이 아닙니다.','방진마스크는 CO를 제거하지 않습니다.','산소결핍. 방진마스크 착용','방진마스크는 모든 증기를 제거하지 못한다.'])
  assert.ok(!categories({title:'점검',body,ppe:['방진마스크']}).includes('particulate-respirator'));
 assert.ok(categories({title:'일반 분진 작업',body:'방진마스크 착용 전 밀착 확인'}).includes('particulate-respirator'));
 assert.deepEqual(categories({title:'일반 분진 작업',body:'보호구 종류를 검토한다.'}),[]);
});
test('manual PPE requires exact purpose, dated product review and manufacturer specification evidence',()=>{
 const now=Date.parse('2026-10-22'),checkedAt='2026-10-21T00:00:00Z',expiresAt='2026-11-19T00:00:00Z';
 const offer={id:'example',title:'Example eyewear',category:'safety-glasses',attributes:{purpose:PPE_PURPOSES['safety-glasses']},merchantId:'m',country:'KR',mode:'link-only',availability:'unknown',affiliateUrl:'https://shop.example/eyewear',checkedAt,expiresAt};
 const catalog={version:1,merchants:[{id:'m',enabled:true,affiliateApproved:true,displayApproved:true,linkOnlyApproved:true,countries:['KR'],linkHosts:['shop.example'],maxAgeHours:720}],offers:[offer],reviews:[{offerFingerprint:offerFingerprint(offer),status:'approved',reviewer:'test',reviewedAt:checkedAt,validUntil:expiresAt,specificationReviewed:true,specificationSources:['https://www.3m.co.kr/example']}],profiles:[]};
 const run=c=>selectOffers({catalog:c,snapshot:{title:'자재 취급',ppe:['보안경']},country:'KR',now});
 assert.equal(run(catalog).length,1);
 for(const mutate of [c=>c.reviews[0].specificationReviewed=false,c=>c.reviews[0].specificationSources=[],c=>c.reviews[0].specificationSources=['https://www.3m.co.kr.evil.example/test'],c=>c.reviews[0].validUntil=checkedAt,c=>c.offers[0].attributes.purpose='different']){
  const changed=structuredClone(catalog);mutate(changed);assert.equal(run(changed).length,0);
 }
});

test('helmets and harnesses are selected from case and UGC content, not only title fields',()=>{
 assert.ok(categories({title:'블록벽 쌓기',body:'자재 낙하와 통로 위험을 관리한다.'}).includes('safety-helmet'));
 assert.ok(categories({title:'상부 설비 정비',steps:[{title:'작업 준비',controls:[['전신형 안전대 착용 및 앵커 확인','']]}]}).includes('fall-arrest-harness'));
 assert.ok(categories({title:'자재 운반',ppe:['안전모']}).includes('safety-helmet'));
 assert.ok(!categories({title:'지상 작업',body:'안전대 착용 불필요.'}).includes('fall-arrest-harness'));
 assert.ok(!categories({title:'로프 접근 작업',ppe:['안전대']}).includes('fall-arrest-harness'));
});
test('protective clothing recognizes body evidence and dust tasks while retaining exposure boundaries',()=>{
 assert.ok(categories({title:'분체 투입',body:'분진 발생. 방진복 착용.'}).includes('protective-coverall'));
 assert.ok(categories({title:'석고보드 집진 샌딩',body:'분진 발생을 통제한다.'}).includes('protective-coverall'));
 assert.ok(categories({title:'일반 건식 정리',body:'오염방지복 착용.'}).includes('contamination-coverall'));
 assert.ok(!categories({title:'감염성 폐기물 처리',body:'오염방지복 착용.'}).includes('contamination-coverall'));
 assert.ok(!categories({title:'서류 정리',body:'PDF 인쇄'}).includes('protective-coverall'));
});

test('safety-measure wording is not a fall-arrest harness reference',()=>{
 assert.ok(!categories({title:'지게차 자재 운반',scope:'단계별 위험요인과 현재 안전대책·감소권고대책을 정리합니다.',ppe:['안전모']}).includes('fall-arrest-harness'));
 assert.ok(categories({title:'상부 작업',body:'전신형 안전대를 착용하고 연결장치 적합성을 확인한다.'}).includes('fall-arrest-harness'));
});
