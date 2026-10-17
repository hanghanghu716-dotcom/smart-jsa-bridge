import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {knowledgeContentHash,validateKnowledgeUnit} from './recommendation-knowledge.js';
import {reverseReviewCorrections} from './recommendation-review-history.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${n}`,import.meta.url),'utf8'));
const units=['regional-drafts.json','pressure-welding-drafts.json','pilot.en-US.json'].flatMap(n=>read(n).units);
const batch=read('content-review-batch19.json'),prior=read('content-review-batch18.json');
const history=['technical-review-records.json','content-review-records.json',...Array.from({length:6},(_,i)=>`content-review-batch${i+13}.json`)].flatMap(n=>read(n).reviews);
const key=r=>`${r.unitId}:${r.area}`;

test('three evidenced regional decisions advance167 to170 without counting six replacements',()=>{
 const latest=new Map(history.map(r=>[key(r),r]));assert.equal(latest.size,167);
 assert.equal(batch.completedReviewAreas,3);assert.equal(batch.revalidatedReviewAreas,6);
 for(const r of batch.reviews){
  const old=latest.get(key(r));
  assert.equal(r.newCompletion,!old);
  if(old){assert.equal(r.supersedes.contentHash,old.contentHash);assert.notEqual(r.contentHash,old.contentHash);}
  else{assert.equal(r.area,'regional');assert.equal(r.unresolvedLegalCheck,null);assert.deepEqual(r.previousIncompleteAssessment,prior.pendingRegionalReviews.find(x=>x.unitId===r.unitId));}
  assert.equal(r.countedComplete,true);assert.ok(r.currentOfficialChecks.length);assert.ok(r.rationale&&r.reviewMethod&&r.reviewedAtUtc);
  latest.set(key(r),r);
 }
 assert.equal(latest.size,170);assert.equal(batch.totalCompletedReviewAreasIncludingPrior,170);
 assert.deepEqual(['technical','regional','translation'].map(a=>[...latest.values()].filter(r=>r.area===a).length),[60,50,60]);
 assert.equal(batch.pendingRegionalReviews.length,10);
 for(const r of batch.pendingRegionalReviews){assert.equal(r.decision,null);assert.equal(r.countedComplete,false);assert.ok(r.unresolvedLegalCheck&&r.requiredToComplete);assert.ok(!latest.has(key(r)));}
 for(const r of [...latest.values(),...batch.pendingRegionalReviews]){const u=units.find(x=>x.id===r.unitId);assert.equal(r.contentHash,knowledgeContentHash(u));assert.equal(r.sourceFingerprint,u.sourceFingerprint);assert.equal(r.approvalGranted,false);}
});

test('Singapore corrections preserve physical safeguards, enforce new obligations and remain unpublished',()=>{
 const before=reverseReviewCorrections(units,batch.corrections);assert.equal(batch.corrections.length,3);
 for(const c of batch.corrections){
  const u=units.find(x=>x.id===c.unitId),old=before.find(x=>x.id===c.unitId);
  assert.equal(u.revision,old.revision+1);assert.equal(u.control,old.control);assert.equal(u.sourceFingerprint,old.sourceFingerprint);assert.deepEqual(u.sources,old.sources);
  assert.deepEqual(u.applicability.excludedConditions,old.applicability.excludedConditions);
  assert.ok(old.applicability.conditionsRequired.every(k=>u.applicability.conditionsRequired.includes(k)));
  assert.deepEqual(u.conditions,u.applicability.conditionsRequired.map(k=>u.conditionLabels[k]));
  assert.ok(u.verification.startsWith(old.verification));
  if(u.id.endsWith('welding-fume')){assert.match(u.verification,/competent person.*intervals.*First Schedule.*short-term.*combined-exposure/);assert.match(u.verification,/five years.*Commissioner/);assert.match(u.coverageLimit,/39\(9\).*outside/);}
  else assert.ok(u.applicability.conditionsRequired.includes('lockout-instruction-completed'));
 }
 for(const u of units){assert.equal(u.status,'draft');assert.equal(u.recommendationScore,null);assert.ok(validateKnowledgeUnit(u,{forPublication:true}).length);}
 const edited=structuredClone(units);edited.find(u=>u.id===batch.corrections[0].unitId).control+=' changed';assert.throws(()=>reverseReviewCorrections(edited,batch.corrections));
});

test('official indexed evidence is auditable and corrected Korean reference does not count as completion',()=>{
 assert.equal(batch.officialEvidence.length,3);
 for(const e of batch.officialEvidence){assert.match(e.url,/^https:\/\/sso\.agc\.gov\.sg\//);assert.match(e.representationSha256,/^[a-f0-9]{64}$/);assert.ok(e.representationUtf8Bytes>1000);assert.equal(e.directFetchSucceeded,false);assert.match(e.method,/index/);assert.ok(e.sections.length&&e.statusObserved);}
 const kr=batch.pendingRegionalReviews.find(r=>r.unitId==='regional-kr-welding-fume');assert.equal(kr.countedComplete,false);assert.equal(kr.decision,null);assert.match(kr.erratum.correct,/Annex17/);
 assert.doesNotMatch(JSON.stringify([kr.unresolvedLegalCheck,kr.requiredInputs,kr.requiredToComplete]),/16-2|16의2/);
 assert.equal(batch.unresolvedLegalChecks.length,10);
});
