import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {knowledgeContentHash,validateKnowledgeUnit} from './recommendation-knowledge.js';
import {reverseReviewCorrections} from './recommendation-review-history.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${n}`,import.meta.url),'utf8'));
const units=reverseReviewCorrections(['regional-drafts.json','pressure-welding-drafts.json','pilot.en-US.json'].flatMap(n=>read(n).units),read('content-review-batch19.json').corrections);
const batch=read('content-review-batch18.json'),prior=read('content-review-batch17.json');
const history=['technical-review-records.json','content-review-records.json','content-review-batch13.json','content-review-batch14.json','content-review-batch15.json','content-review-batch16.json','content-review-batch17.json'].flatMap(n=>read(n).reviews);
const key=r=>`${r.unitId}:${r.area}`;

test('batch18 covers all43 pending areas, excludes13 evidence gaps and counts replacements once',()=>{
 const latest=new Map(history.map(r=>[key(r),r]));assert.equal(latest.size,137);
 assert.equal(batch.attemptedRegionalReviewAreas,43);assert.equal(batch.completedReviewAreas,30);assert.equal(batch.revalidatedReviewAreas,86);
 for(const r of batch.reviews){
  const old=latest.get(key(r));
  if(old){assert.equal(r.newCompletion,false);assert.equal(r.supersedes.contentHash,old.contentHash);assert.equal(r.supersedes.sourceFingerprint,old.sourceFingerprint);assert.notEqual(r.contentHash,old.contentHash);}
  else{assert.equal(r.newCompletion,true);assert.equal(r.area,'regional');assert.equal(r.unresolvedLegalCheck,null);}
  latest.set(key(r),r);assert.equal(r.countedComplete,true);assert.equal(r.decision,'completed_with_limitations');
 }
 assert.equal(latest.size,167);assert.equal(batch.totalCompletedReviewAreasIncludingPrior,167);
 assert.deepEqual(['technical','regional','translation'].map(a=>[...latest.values()].filter(r=>r.area===a).length),[60,47,60]);
 const pending=batch.pendingRegionalReviews;assert.equal(pending.length,13);
 for(const r of pending){assert.equal(r.area,'regional');assert.equal(r.decision,null);assert.equal(r.countedComplete,false);assert.ok(r.requiredToComplete&&r.requiredInputs.length&&r.unresolvedLegalCheck);assert.ok(!latest.has(key(r)));}
 const assessed=[...batch.reviews.filter(r=>r.area==='regional'),...pending];
 assert.equal(new Set(assessed.map(key)).size,43);
 assert.deepEqual(assessed.map(r=>r.unitId).sort(),prior.pendingRegionalReviews.map(r=>r.unitId).sort());
 for(const r of [...latest.values(),...pending]){
  const u=units.find(u=>u.id===r.unitId);assert.equal(r.contentHash,knowledgeContentHash(u));assert.equal(r.sourceFingerprint,u.sourceFingerprint);assert.equal(r.approvalGranted,false);
 }
 for(const r of [...batch.reviews,...pending]){
  assert.ok(r.rationale&&r.reviewMethod&&r.reviewedAtUtc&&r.checks.length);
  assert.equal(r.legalComplianceApproved,false);assert.ok(r.remainingIssues.length);
  if(r.area==='translation')assert.equal(r.comparedFields.length,10);
  if(r.area==='regional')assert.deepEqual(r.previousIncompleteAssessment,prior.pendingRegionalReviews.find(x=>x.unitId===r.unitId));
 }
});

test('corrected content keeps all prior exclusions and physical safeguards and cannot publish',()=>{
 const old=reverseReviewCorrections(units,batch.corrections);assert.equal(batch.corrections.length,43);
 for(const c of batch.corrections){
  const u=units.find(u=>u.id===c.unitId),previous=old.find(u=>u.id===c.unitId);
  assert.equal(u.revision,previous.revision+1);assert.equal(u.sourceFingerprint,previous.sourceFingerprint);
  assert.deepEqual(u.sources,previous.sources);assert.deepEqual(u.applicability.excludedConditions,previous.applicability.excludedConditions);
  assert.deepEqual(u.conditions,u.applicability.conditionsRequired.map(k=>u.conditionLabels[k]));assert.deepEqual(u.exclusions,u.applicability.excludedConditions.map(k=>u.conditionLabels[k]));
  assert.ok(u.applicability.conditionsRequired.includes('regional-applicability-confirmed'));
  for(const area of ['technical','translation'])assert.equal(batch.reviews.filter(r=>r.unitId===u.id&&r.area===area&&r.supersedes).length,1);
  if(u.id.endsWith('pressure-filter')||u.id==='compressed-air-filter-backfeed'){assert.equal(u.control,previous.control);assert.equal(u.verification,previous.verification);}
 }
 for(const u of units){assert.equal(u.status,'draft');assert.equal(u.recommendationScore,null);for(const a of ['technical','regional','translation'])assert.equal(u.review[`${a}Status`],'pending');assert.ok(validateKnowledgeUnit(u,{forPublication:true}).length);}
 const tampered=structuredClone(units);tampered.find(u=>u.id===batch.corrections[0].unitId).control+=' Unreviewed';assert.throws(()=>reverseReviewCorrections(tampered,batch.corrections));
 const get=id=>units.find(u=>u.id===id);
 assert.match(get('regional-sg-maintenance').verification,/dissipated or restrained/);
 assert.match(get('regional-sg-welding-fume').control,/eliminating or substituting.*source extraction.*respiratory/);
 assert.match(get('regional-de-welding-fume').verification,/allein belegt keine sichere Exposition/);
 assert.match(get('regional-br-welding-fume').coverageLimit,/NR1, NR9.*NR15.*PGR.*NR6/);
 assert.match(get('regional-ca-on-welding-fume').coverageLimit,/industrial-establishment.*not assumed/);
 assert.match(get('regional-kr-welding-fume').verification,/풍량.*충분하다고 판정하지/);
});

test('source comparisons retain capture identity and distinguish fiction from fresh DB provenance',()=>{
 const captures=read('guidance-source-captures.json').captures;
 for(const r of [...batch.reviews,...batch.pendingRegionalReviews]){
  for(const e of r.evidence){const c=captures.find(c=>c.id===e.captureId);assert.ok(c);assert.equal(c.url,e.url);assert.deepEqual(c.fragments,e.fragments);}
  for(const c of r.sourceComparisons){const original=captures.find(x=>x.id===c.captureId);assert.equal(c.edition,original.edition);assert.equal(c.originalRetrievedOn,original.retrievedOn);assert.equal(c.retrievalRef,original.retrievalRef);}
  const u=units.find(u=>u.id===r.unitId);
  if(u.caseGroupId){assert.equal(r.caseSourceEvidence.sourceFingerprint,u.sourceFingerprint);assert.equal(r.freshCaseSourceCheck.unchanged,true);assert.equal(r.freshCaseSourceCheck.readOnly,true);}
 }
 assert.equal(batch.caseSourceCheck.rowsCompared,3);assert.equal(batch.caseSourceCheck.allUnchanged,true);assert.equal(batch.caseSourceCheck.sourceIsIndependentProfessionalEvidence,false);
 assert.equal(batch.unresolvedLegalChecks.length,13);assert.ok(batch.unresolvedLegalChecks.every(x=>x.status==='unresolved'&&x.countsAsLegalCompletion===false));
});
