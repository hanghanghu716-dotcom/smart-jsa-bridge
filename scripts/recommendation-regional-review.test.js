import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {knowledgeContentHash,validateKnowledgeUnit} from './recommendation-knowledge.js';
import {reverseReviewCorrections} from './recommendation-review-history.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${n}`,import.meta.url),'utf8'));
const units=reverseReviewCorrections(reverseReviewCorrections(['regional-drafts.json','pressure-welding-drafts.json','pilot.en-US.json'].flatMap(n=>read(n).units),read('content-review-batch18.json').corrections),read('content-review-batch17.json').corrections);
const batch=read('content-review-batch16.json');
const prior=['technical-review-records.json','content-review-records.json','content-review-batch13.json','content-review-batch14.json','content-review-batch15.json'].flatMap(n=>read(n).reviews);
const key=r=>`${r.unitId}:${r.area}`;

test('batch16 replaces changed-content reviews without inflating unique completion',()=>{
 const latest=new Map(prior.map(r=>[key(r),r]));
 assert.equal(latest.size,123);assert.equal(batch.reviews.length,28);
 for(const r of batch.reviews){
  const old=latest.get(key(r));
  if(old){assert.equal(r.newCompletion,false);assert.equal(r.supersedes.contentHash,old.contentHash);assert.equal(r.supersedes.sourceFingerprint,old.sourceFingerprint);assert.notEqual(r.contentHash,old.contentHash);}
  else{assert.equal(r.newCompletion,true);assert.equal(r.area,'regional');}
  latest.set(key(r),r);
  assert.ok(r.rationale&&r.reviewMethod&&r.reviewedAtUtc&&r.checks.length&&r.currentOfficialChecks.length);
  if(r.area==='translation')assert.equal(r.comparedFields.length,10);
 }
 assert.equal(latest.size,133);assert.equal(batch.completedReviewAreas,10);assert.equal(batch.revalidatedReviewAreas,18);
 assert.deepEqual(['technical','regional','translation'].map(a=>[...latest.values()].filter(r=>r.area===a).length),[60,13,60]);
 for(const r of latest.values()){const u=units.find(u=>u.id===r.unitId);assert.equal(r.contentHash,knowledgeContentHash(u));assert.equal(r.sourceFingerprint,u.sourceFingerprint);assert.equal(r.approvalGranted,false);}
 for(const u of units){assert.equal(u.status,'draft');assert.equal(u.recommendationScore,null);for(const area of ['technical','regional','translation'])assert.equal(u.review[`${area}Status`],'pending');assert.ok(validateKnowledgeUnit(u,{forPublication:true}).length);}
 assert.equal(batch.pendingRegionalReviews.length,47);
 const pending=new Set();for(const r of batch.pendingRegionalReviews){assert.equal(r.decision,null);assert.equal(r.countedComplete,false);assert.ok(r.requiredInputs.length&&r.requiredToComplete&&r.blockerCategory);assert.ok(!latest.has(key(r)));assert.ok(!pending.has(key(r)));pending.add(key(r));assert.equal(r.contentHash,knowledgeContentHash(units.find(u=>u.id===r.unitId)));}
 assert.equal(latest.size+pending.size,180);
});

test('batch16 history is reversible and stale reviews fail on corrected content',()=>{
 const old=reverseReviewCorrections(units,batch.corrections);assert.equal(batch.corrections.length,9);
 for(const c of batch.corrections){
  const u=units.find(u=>u.id===c.unitId);assert.equal(c.revision,c.previousRevision+1);
  assert.equal(knowledgeContentHash(old.find(u=>u.id===c.unitId)),c.previousContentHash);
  for(const area of ['technical','translation'])assert.equal(batch.reviews.filter(r=>r.unitId===u.id&&r.area===area&&r.supersedes).length,1);
  assert.deepEqual(u.conditions,u.applicability.conditionsRequired.map(k=>u.conditionLabels[k]));assert.deepEqual(u.exclusions,u.applicability.excludedConditions.map(k=>u.conditionLabels[k]));
 }
 const tampered=structuredClone(units);tampered.find(u=>u.id===batch.corrections[0].unitId).control+=' Unreviewed change';
 assert.throws(()=>reverseReviewCorrections(tampered,batch.corrections));
 const get=id=>units.find(u=>u.id===id);
 assert.match(get('regional-ca-qc-maintenance').control,/Arrêter complètement/);assert.match(get('regional-ca-qc-maintenance').control,/cléage unique/);
 assert.match(get('regional-jp-welding-fume').verification,/フィットテスト結果は3年間/);assert.match(get('regional-jp-welding-fume').verification,/用いなくなった日から3年/);
 assert.match(get('regional-es-welding-fume').control,/eliminación.*sustitución/);
 assert.match(get('regional-de-maintenance').conditionLabels['competent-person-assigned'],/unterwiesene/);
 assert.ok(get('regional-ca-bc-welding-fume').applicability.conditionsRequired.includes('bc-regime-confirmed'));
});
