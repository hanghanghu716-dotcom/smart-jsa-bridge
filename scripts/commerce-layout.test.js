import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';
import { splitCaseSections } from '../src/utils/caseSections.js';
import { extractAccessoryNeeds } from '../server/commerce/needs.js';
import { offerFingerprint, fingerprint, selectOffers } from '../server/commerce/engine.js';
const cats=(title,body='')=>extractAccessoryNeeds({title,body}).map(n=>n.category);
test('case review section moves without losing nested content or changing its wording',()=>{
 const source='<div lang="ko"><h2>10. FAQ</h2><p>before</p><h2 id="section-11"><strong>11. 작성·전문검토 상태와 수정 이력</strong></h2><div><table><tbody><tr><td>record</td></tr></tbody></table></div><p>after</p></div>';
 const {main,review}=splitCaseSections(source);
 assert.ok(main.includes('before'));assert.ok(!main.includes('record'));
 assert.ok(review.includes('13. 작성·전문검토 상태와 수정 이력'));assert.ok(review.includes('section-13'));assert.ok(review.includes('record'));assert.ok(review.includes('after'));
 assert.equal(parseFragment(main).childNodes[0].tagName,'div');
 assert.deepEqual(splitCaseSections('## 6. Older article\nText'),{main:'## 6. Older article\nText',review:''});
});
test('task matching distinguishes ordinary tools from installed machine and structural components',()=>{
 assert.ok(cats('휴대 원형톱 목재 절단','클램프 고정 절단선 표시').includes('wood-clamp'));
 for(const title of ['타워크레인 조립','비계 설치','태양광 모듈 설치'])assert.ok(!cats(title,'클램프 고정').includes('wood-clamp'));
 assert.ok(!cats('범용 밀링머신 금속 가공','바이스 고정').includes('bench-vise'));
 assert.ok(!cats('보행식 바닥 세척기 청소','스퀴지 부품 교체').includes('floor-squeegee'));
 assert.ok(!cats('아스팔트 도로 포장','품목 라벨').includes('packing-dispenser'));
 assert.ok(!cats('활선 전기 분전반 점검','나사 볼트 렌치').includes('adjustable-wrench'));
 assert.ok(cats('실내 바닥·계단 수작업 청소').includes('floor-squeegee'));
});
test('eight distinct products are selected once and image changes invalidate their review',()=>{
 const snapshot={kind:'case',id:'sample',locale:'ko',title:'Task'};
 const categories=['clipboard','document-holder','tool-storage','parts-organizer','measuring-tape','carpenter-pencil','masking-tape','paint-roller','paint-tray'];
 const checkedAt='2026-10-21T00:00:00Z',expiresAt='2026-11-19T00:00:00Z',now=Date.parse('2026-10-22');
 const offers=categories.map(category=>({id:category,category,title:category,merchantId:'m',country:'KR',mode:'link-only',availability:'unknown',affiliateUrl:'https://shop.example/'+category,imageUrl:'https://images.example/'+category+'.png',checkedAt,expiresAt}));
 const catalog={version:1,merchants:[{id:'m',enabled:true,affiliateApproved:true,displayApproved:true,linkOnlyApproved:true,countries:['KR'],linkHosts:['shop.example'],imageHosts:['images.example'],maxAgeHours:720}],offers,reviews:offers.map(o=>({offerFingerprint:offerFingerprint(o),status:'approved',reviewer:'test',reviewedAt:checkedAt,validUntil:expiresAt})),profiles:[{sourceFingerprint:fingerprint(snapshot),status:'approved',reviewer:'test',reviewedAt:checkedAt,validUntil:expiresAt,needs:categories.map(category=>({category,constraints:{}}))}]};
 const items=selectOffers({snapshot,catalog,country:'KR',now,limit:100});
 assert.equal(items.length,8);assert.equal(new Set(items.map(x=>x.href)).size,8);assert.ok(items.every(x=>x.imageUrl?.startsWith('https://images.example/')));
 const old=offers[0].imageUrl;offers[0].imageUrl='https://images.example/wrong-sku.png';
 assert.ok(!selectOffers({snapshot,catalog,country:'KR',now}).some(x=>x.category===offers[0].category));offers[0].imageUrl=old;
 catalog.merchants[0].imageHosts=[];
 assert.ok(selectOffers({snapshot,catalog,country:'KR',now}).every(x=>x.imageUrl===null));
});
