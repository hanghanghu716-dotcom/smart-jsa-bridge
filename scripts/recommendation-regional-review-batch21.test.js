import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {knowledgeContentHash,validateKnowledgeUnit} from './recommendation-knowledge.js';
import {reverseReviewCorrections} from './recommendation-review-history.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${n}`,import.meta.url),'utf8'));
const units=['regional-drafts.json','pressure-welding-drafts.json','pilot.en-US.json'].flatMap(n=>read(n).units);
const batch=read('content-review-batch21.json'),prior=read('content-review-batch20.json');
const history=['technical-review-records.json','content-review-records.json',...Array.from({length:8},(_,i)=>`content-review-batch${i+13}.json`)].flatMap(n=>read(n).reviews);
const key=r=>`${r.unitId}:${r.area}`;

test('seven regional completions and fourteen changed-content replacements produce177 unique areas',()=>{
 const latest=new Map(history.map(r=>[key(r),r]));assert.equal(latest.size,170);
 assert.equal(batch.reviews.length,21);assert.equal(batch.completedReviewAreas,7);assert.equal(batch.revalidatedReviewAreas,14);
 for(const r of batch.reviews){
  const old=latest.get(key(r));assert.equal(r.newCompletion,!old);
  if(old){assert.equal(r.supersedes.contentHash,old.contentHash);assert.notEqual(r.contentHash,old.contentHash);assert.notEqual(r.area,'regional');}
  else{assert.equal(r.area,'regional');assert.deepEqual(r.previousIncompleteAssessment,prior.pendingRegionalReviews.find(x=>x.unitId===r.unitId));}
  assert.equal(r.countedComplete,true);assert.equal(r.unresolvedLegalCheck,null);
  assert.ok(r.rationale&&r.reviewMethod&&r.checks.length&&r.currentOfficialChecks.length);
  if(r.area==='translation'){assert.equal(new Set(r.comparedFields).size,10);assert.ok(r.semanticCheck);}
  latest.set(key(r),r);
 }
 assert.equal(latest.size,177);assert.equal(batch.totalCompletedReviewAreasIncludingPrior,177);
 assert.deepEqual(['technical','regional','translation'].map(a=>[...latest.values()].filter(r=>r.area===a).length),[60,57,60]);
 for(const r of [...latest.values(),...batch.pendingRegionalReviews]){const u=units.find(u=>u.id===r.unitId);assert.equal(r.contentHash,knowledgeContentHash(u));assert.equal(r.sourceFingerprint,u.sourceFingerprint);assert.equal(r.approvalGranted,false);}
 assert.deepEqual(batch.pendingRegionalReviews.map(r=>r.unitId).sort(),['regional-sa-maintenance','regional-sa-pressure-filter','regional-sa-welding-fume']);
 for(const r of batch.pendingRegionalReviews){assert.equal(r.decision,null);assert.equal(r.countedComplete,false);assert.equal(latest.has(key(r)),false);assert.ok(r.requiredInputs.length&&r.requiredToComplete&&r.unresolvedLegalCheck);}
});

test('corrections are reversible and preserve physical safeguards, exclusions and required conditions',()=>{
 const before=reverseReviewCorrections(units,batch.corrections);assert.equal(batch.corrections.length,7);
 for(const c of batch.corrections){
  const u=units.find(x=>x.id===c.unitId),old=before.find(x=>x.id===c.unitId);
  assert.equal(u.revision,old.revision+1);assert.deepEqual(u.sources,old.sources);assert.equal(u.sourceFingerprint,old.sourceFingerprint);
  assert.ok(u.control.includes(old.control));assert.ok(u.verification.startsWith(old.verification));
  assert.ok(old.applicability.conditionsRequired.every(k=>u.applicability.conditionsRequired.includes(k)));
  assert.ok(old.applicability.excludedConditions.every(k=>u.applicability.excludedConditions.includes(k)));
  assert.deepEqual(u.conditions,u.applicability.conditionsRequired.map(k=>u.conditionLabels[k]));
  assert.deepEqual(u.exclusions,u.applicability.excludedConditions.map(k=>u.conditionLabels[k]));
  if(u.id.startsWith('regional-ru-')&&!u.id.endsWith('welding-fume')){assert.match(u.control,/заглушек.*не разрешают разборку под давлением/);assert.match(u.verification,/не заменяет физическое отключение/);}
  if(u.id.startsWith('regional-it-')&&!u.id.endsWith('welding-fume'))assert.ok(u.applicability.conditionsRequired.includes('qualified-maintenance-and-checks-confirmed'));
 }
 const ru=units.find(u=>u.id==='regional-ru-welding-fume');assert.ok(ru.applicability.excludedConditions.includes('automated-or-mechanized-welding'));assert.ok(ru.applicability.excludedConditions.includes('hazardous-substance-industrial-facility'));
 const it=units.find(u=>u.id==='regional-it-welding-fume');assert.match(it.verification,/articolo 234/);assert.ok(it.applicability.conditionsRequired.includes('constituent-risk-assessment-completed'));
 const kr=units.find(u=>u.id==='regional-kr-welding-fume');assert.match(kr.control,/제617조/);assert.match(kr.verification,/제612조/);assert.match(kr.verification,/노출기준 이하라는 이유만으로 제617조 보호구 예외를 인정하지 않는다/);assert.doesNotMatch(kr.coverageLimit,/필터/);
 const tampered=structuredClone(units);tampered.find(u=>u.id===batch.corrections[0].unitId).control+=' stale';assert.throws(()=>reverseReviewCorrections(tampered,batch.corrections));
});

test('evidence distinguishes signed originals, editorial compilation, unrendered annex and wrong download',()=>{
 assert.equal(batch.officialEvidence.length,9);
 for(const e of batch.officialEvidence){assert.match(e.url,/^https:\/\//);assert.ok(e.sections.length&&e.findings.length&&e.method&&e.observedOn);if(e.rawFileSha256)assert.match(e.rawFileSha256,/^[a-f0-9]{64}$/);for(const p of e.pageImageDigests||[])assert.match(p.sha256,/^[a-f0-9]{64}$/);}
 const ev=id=>batch.officialEvidence.find(e=>e.id===id);
 assert.match(ev('it-inl-oct2026').authorityLimit,/editorial compilation/);
 assert.equal(ev('ru-833-signed').pageImageDigests.length,8);assert.equal(ev('ru-884-signed').pageImageDigests.length,7);
 assert.match(ev('ru-287-signed').findings.join(' '),/1September2025.*1September2031/);
 assert.match(ev('kr-measurement-law').findings.join(' '),/no claim to have read that attachment/);
 assert.equal(ev('sa-mislabelled-download').acceptedAsCompletionEvidence,false);assert.match(ev('sa-mislabelled-download').findings.join(' '),/Excavation Works/);
 assert.equal(batch.unresolvedLegalChecks.length,3);assert.ok(batch.unresolvedLegalChecks.every(r=>r.countsAsLegalCompletion===false));
});

test('review completion cannot publish or advance later workstreams',()=>{
 assert.equal(units.length,60);
 for(const u of units){assert.equal(u.status,'draft');assert.equal(u.recommendationScore,null);for(const a of ['technical','regional','translation'])assert.equal(u.review[a+'Status'],'pending');assert.ok(validateKnowledgeUnit(u,{forPublication:true}).length);}
 assert.equal(batch.releaseApproval,false);assert.equal(batch.publicationApprovals,0);
 for(const r of batch.reviews){assert.equal(r.legalComplianceApproved,false);assert.equal(r.legalCurrencyVerified,false);assert.equal(r.approvalGranted,false);}
 assert.deepEqual(batch.checklist.map(c=>[c.completed,c.total]),[[57,57],[57,57],[177,180],[0,19],[0,4892],[0,6],[0,3],[0,19]]);
});
