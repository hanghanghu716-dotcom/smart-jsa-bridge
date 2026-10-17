import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {knowledgeContentHash,validateKnowledgeUnit} from './recommendation-knowledge.js';
import {reverseReviewCorrections} from './recommendation-review-history.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${n}`,import.meta.url),'utf8'));
const units=['regional-drafts.json','pressure-welding-drafts.json','pilot.en-US.json'].flatMap(n=>read(n).units);
const batch=read('content-review-batch17.json');
const prior=['technical-review-records.json','content-review-records.json','content-review-batch13.json','content-review-batch14.json','content-review-batch15.json','content-review-batch16.json'].flatMap(n=>read(n).reviews);
const key=r=>`${r.unitId}:${r.area}`;

test('batch17 counts only four new regional areas and validates all current reviews',()=>{
 const latest=new Map(prior.map(r=>[key(r),r]));
 assert.equal(latest.size,133);assert.equal(batch.reviews.length,12);
 for(const r of batch.reviews){
  const old=latest.get(key(r));
  if(old){assert.equal(r.newCompletion,false);assert.equal(r.supersedes.contentHash,old.contentHash);assert.equal(r.supersedes.sourceFingerprint,old.sourceFingerprint);assert.notEqual(r.contentHash,old.contentHash);}
  else{assert.equal(r.newCompletion,true);assert.equal(r.area,'regional');}
  latest.set(key(r),r);
  assert.ok(r.rationale&&r.reviewMethod&&r.reviewedAtUtc&&r.currentOfficialChecks.length);
  assert.ok(r.currentOfficialChecks.every(c=>c.url.startsWith('https://')&&c.retrievalRef&&!c.retrievalRef.includes('TO_VERIFY')));
  if(r.area==='translation')assert.equal(r.comparedFields.length,10);
 }
 assert.equal(latest.size,137);assert.equal(batch.completedReviewAreas,4);assert.equal(batch.revalidatedReviewAreas,8);
 assert.deepEqual(['technical','regional','translation'].map(a=>[...latest.values()].filter(r=>r.area===a).length),[60,17,60]);
 for(const r of latest.values()){const u=units.find(u=>u.id===r.unitId);assert.equal(r.contentHash,knowledgeContentHash(u));assert.equal(r.sourceFingerprint,u.sourceFingerprint);assert.equal(r.approvalGranted,false);}
 for(const u of units){assert.equal(u.status,'draft');assert.equal(u.recommendationScore,null);for(const area of ['technical','regional','translation'])assert.equal(u.review[`${area}Status`],'pending');assert.ok(validateKnowledgeUnit(u,{forPublication:true}).length);}
 const pending=new Set();const categories={};
 for(const r of batch.pendingRegionalReviews){assert.equal(r.decision,null);assert.equal(r.countedComplete,false);assert.ok(!latest.has(key(r)));assert.ok(!pending.has(key(r)));pending.add(key(r));assert.equal(r.contentHash,knowledgeContentHash(units.find(u=>u.id===r.unitId)));categories[r.blockerCategory]=(categories[r.blockerCategory]??0)+1;}
 assert.equal(pending.size,43);assert.equal(latest.size+pending.size,180);
 assert.deepEqual(categories,{jurisdiction_and_sector:10,equipment_classification:20,official_text_and_scope:13});
});

test('batch17 corrected scope and safeguards survive round-trip history validation',()=>{
 const old=reverseReviewCorrections(units,batch.corrections);assert.equal(batch.corrections.length,4);
 for(const c of batch.corrections){
  const u=units.find(u=>u.id===c.unitId);assert.equal(c.revision,c.previousRevision+1);
  assert.equal(knowledgeContentHash(old.find(u=>u.id===c.unitId)),c.previousContentHash);
  for(const area of ['technical','translation'])assert.equal(batch.reviews.filter(r=>r.unitId===u.id&&r.area===area&&r.supersedes).length,1);
  assert.deepEqual(u.conditions,u.applicability.conditionsRequired.map(k=>u.conditionLabels[k]));
  assert.deepEqual(u.exclusions,u.applicability.excludedConditions.map(k=>u.conditionLabels[k]));
 }
 const get=id=>units.find(u=>u.id===id);
 assert.match(get('regional-ca-ab-maintenance').verification,/Each worker tests and confirms/);
 assert.match(get('regional-ca-ab-maintenance').coverageLimit,/215\.1.*professional-engineer certification/);
 assert.match(get('regional-fr-maintenance').conditionLabels['competent-person-assigned'],/formation spécifique/);
 assert.match(get('regional-ca-ab-welding-fume').control,/eliminating.*engineering.*administrative.*respiratory/);
 assert.match(get('regional-ca-ab-welding-fume').verification,/Airflow alone does not/);
 assert.match(get('regional-fr-welding-fume').verification,/non directement décelable/);
 assert.match(get('regional-fr-welding-fume').coverageLimit,/système clos/);
 const tampered=structuredClone(units);tampered.find(u=>u.id===batch.corrections[0].unitId).control+=' Unreviewed change';
 assert.throws(()=>reverseReviewCorrections(tampered,batch.corrections));
});
