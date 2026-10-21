import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAccessoryNeeds } from '../server/commerce/needs.js';
import { offerFingerprint, selectOffers } from '../server/commerce/engine.js';
import { productPurpose, getSupportUi } from '../src/locales/supportUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
const categories=s=>extractAccessoryNeeds(s).map(n=>n.category);
test('painting machinery is not a manual wall-painting shopping context',()=>{
 for(const title of ['Paint bead mill restoration','Battery electrode coating line restoration','철재 난간 유기용제 도장']){
  assert.ok(!categories({title,body:'paint roller, tools, checklist'}).includes('paint-roller'));
 }
 assert.ok(categories({title:'지상 벽면 수성페인트 롤러 도장 작업',body:'점검표'}).includes('paint-roller'));
});
test('ordinary cleaning tools are not inferred from housekeeping in hazardous processes',()=>{
 for(const title of ['Sugar silo dust collection','Semiconductor wet-etch restoration','탱크 내부 세정']){
  const result=categories({title,body:'housekeeping cleaning tools bolts checklist'});
  assert.ok(!result.includes('dustpan'));assert.ok(!result.includes('cleaning-cloth'));
 }
 assert.ok(categories({title:'실내 바닥·계단 수작업 청소',body:'점검표'}).includes('dustpan'));
 assert.ok(!categories({title:'Aseptic vial filling line changeover',body:'Store bolts and tools'}).includes('parts-organizer'));
});
test('source boilerplate, HTML attributes and URLs do not create shopping needs',()=>{
 assert.deepEqual(categories({title:'A task',body:'<div class="toolbox"><a href="https://example.com/checklist">Guide</a></div><h2>9. Sources</h2>clipboard tool organizer'}),[]);
});
test('one merchant can supply up to eight different purposes, with task tools ahead of paperwork',()=>{
 const now=Date.parse('2026-10-22T01:00:00Z'), checkedAt='2026-10-22T00:00:00Z',expiresAt='2026-11-20T00:00:00Z';
 const offers=['clipboard','document-holder','paint-roller','paint-tray','paint-brush'].map(category=>({id:category,merchantId:'m',country:'KR',title:category,category,mode:'link-only',affiliateUrl:'https://shop.example/'+category,availability:'unknown',checkedAt,expiresAt}));
 const catalog={version:1,merchants:[{id:'m',enabled:true,affiliateApproved:true,displayApproved:true,linkOnlyApproved:true,countries:['KR'],linkHosts:['shop.example'],maxAgeHours:720}],profiles:[],offers,reviews:offers.map(o=>({offerFingerprint:offerFingerprint(o),status:'approved',reviewer:'test',reviewedAt:checkedAt,validUntil:expiresAt}))};
 const items=selectOffers({snapshot:{title:'지상 벽면 수성페인트 롤러 도장',body:'점검표',locale:'ko'},catalog,country:'KR',now});
 assert.deepEqual(items.map(x=>x.category),['paint-roller','paint-tray','paint-brush']);
 assert.equal(new Set(items.map(x=>x.category)).size,3);
 assert.deepEqual(selectOffers({snapshot:{title:'점검표'},catalog,country:'US',now}),[]);
});
test('site locales have localized rail text and accessory purposes',()=>{
 for(const locale of SUPPORTED_LANGS){assert.ok(getSupportUi(locale).use);assert.ok(productPurpose('parts-organizer',locale));}
 for(const title of ['現場確認表と記録項目','Vérifications et intervention d’urgence','Lista de comprobación','قائمة فحص']){
  assert.ok(!categories({title}).includes('clipboard'));
 }
});

test('distant parts disclaimer and later separation do not imply a parts organizer',()=>{
 const needs=extractAccessoryNeeds({title:'지상 벽면 수성페인트 롤러 도장',body:'장비·부품·방호 방법은 모델과 현장에 따라 달라집니다. 일반적으로 현장 구역을 충분히 확인한 뒤 작업 구역을 분리합니다.'});
 assert.equal(needs.some(n=>n.category==='parts-organizer'),false);
});
