import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';
import { splitCaseSections, splitCaseForCommerce } from '../src/utils/caseSections.js';
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
 assert.ok(!cats('목재 세로켜기','목재를 고정하지 못한다').includes('claw-hammer'));
 assert.ok(!cats('테이블쏘 목재 세로켜기','가이드 고정').includes('wood-clamp'));
 assert.ok(!cats('보강토 옹벽 블록 쌓기','건식 블록').includes('masonry-trowel'));
 assert.ok(!cats('파레트 스트레치 랩 포장','필름으로 감싸기').includes('packing-dispenser'));
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

test('case introduction moves to resources without removing article or review content',()=>{
 const {main,introduction,review}=splitCaseSections('<div><p>Intro and usage</p><h3>Stop condition</h3><p>Stop text</p><h2 id="section-1">1. Basis</h2><p>Body</p><h2>11. Review</h2><p>Record</p></div>');
 assert.ok(!main.includes('Intro and usage'));assert.ok(!main.includes('Stop text'));
 assert.ok(main.includes('1. Basis'));assert.ok(main.includes('Body'));
 assert.ok(introduction.includes('Intro and usage'));assert.ok(introduction.includes('Stop text'));
 assert.ok(review.includes('13. Review'));assert.ok(review.includes('Record'));
});

test('legacy Markdown introductions move too, including bold headings and inline anchors',()=>{
 for(const heading of ['## **1. Body**','## <span id="section-1"></span>1. Body']){
 const result=splitCaseSections('# Title\nIntro\n'+heading+'\nMain text\n## **11. Review**\nRecord');
 assert.equal(result.introduction,'# Title\nIntro');assert.ok(result.main.startsWith(heading));assert.ok(result.main.includes('Main text'));assert.ok(result.review.startsWith('## **13. Review**'));assert.ok(result.review.includes('Record'));
 }
});


test('products split after the complete master table; later sections and links shift together',()=>{
 const content='<div id="article" dir="rtl"><h2 id="section-1">1. Basis</h2><a href="#section-4">Details</a><h2 id="section-3">3. Master</h2><div><table><tbody><tr><td>4. Keep this cell</td></tr></tbody></table><p>Table notes</p></div><section><h2 id="section-4"><strong>4. Controls</strong></h2><p>Keep all controls</p></section><h2 id="section-10">10. FAQ</h2><h2 id="section-11">11. Review</h2><p>Reviewed record</p></div>';
 const s=splitCaseForCommerce(content);
 assert.equal(s.productSection,4);assert.equal(s.resourcesSection,12);
 assert.ok(s.beforeProducts.includes('</table>'));assert.ok(s.beforeProducts.includes('Table notes'));
 assert.ok(s.beforeProducts.includes('4. Keep this cell'));assert.ok(s.beforeProducts.includes('href="#section-5"'));
 assert.ok(!s.beforeProducts.includes('Keep all controls'));
 assert.ok(s.afterProducts.includes('5. Controls'));assert.ok(s.afterProducts.includes('id="section-5"'));
 assert.ok(s.afterProducts.includes('11. FAQ'));assert.ok(s.afterProducts.includes('id="section-11"'));
 assert.ok(s.afterProducts.includes('dir="rtl"'));assert.ok(!s.afterProducts.includes('id="article"'));
 assert.ok(s.review.includes('13. Review'));assert.ok(s.review.includes('Reviewed record'));
 for(const html of [s.beforeProducts,s.afterProducts])assert.equal(parseFragment(html).childNodes[0].tagName,'div');
});

test('Markdown product insertion respects bold headings, inline anchors, tables and fenced examples',()=>{
 const source='# Intro\nNotes\n## 1. Basis\n[Controls](#section-4)\n## 3. Master\n|Step|Control|\n|---|---|\n|3|4. Keep|\n~~~text\n## 4. Example\n~~~\n## <span id="section-4"></span>**4. Controls**\nBody\n## **10. FAQ**\nFAQ\n## **11. Review**\nRecord';
 const s=splitCaseForCommerce(source);
 assert.equal(s.productSection,4);assert.equal(s.resourcesSection,12);
 assert.ok(s.beforeProducts.includes('## 4. Example'));
 assert.ok(s.beforeProducts.includes('[Controls](#section-5)'));
 assert.ok(s.afterProducts.includes('id="section-5"'));assert.ok(s.afterProducts.includes('**5. Controls**'));
 assert.ok(s.afterProducts.includes('**11. FAQ**'));assert.ok(s.review.includes('13. Review'));
 assert.equal(s.introduction,'# Intro\nNotes');
});

test('legacy cases without the master section retain their previous layout',()=>{
 const s=splitCaseForCommerce('## 6. Legacy\nContent');
 assert.equal(s.earlyProducts,false);assert.equal(s.productSection,12);assert.equal(s.resourcesSection,11);
 assert.equal(s.beforeProducts,'## 6. Legacy\nContent');assert.equal(s.afterProducts,'');
 const last=splitCaseForCommerce('<h2>3. Master</h2><table><tr><td>Last row</td></tr></table>');
 assert.equal(last.productSection,4);assert.ok(last.beforeProducts.includes('Last row'));assert.equal(last.afterProducts,'');
});


test('server article presents products fourth, resources twelfth, and review thirteenth',async()=>{
 const {renderCaseArticle}=await import('../api/case-study.js');
 const content=Array.from({length:11},(_,i)=>'<h2 id="section-'+(i+1)+'">'+(i+1)+'. Section</h2><p>Body '+(i+1)+'</p>').join('');
 const html=renderCaseArticle({content_md:content,pdf_download_url:'https://example.com/case.pdf'},'ko');
 const headings=[...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map(match=>Number(match[1].match(/^\d+/)?.[0]));
 assert.deepEqual(headings,[1,2,3,4,5,6,7,8,9,10,11,12,13]);
 assert.ok(html.indexOf('Body 3')<html.indexOf('4. '));
 assert.ok(html.indexOf('4. ')<html.indexOf('Body 4'));
 assert.ok(html.indexOf('case.pdf')>html.indexOf('12. '));
 for(let n=1;n<=11;n++)assert.ok(html.includes('Body '+n+'</p>'));
});
