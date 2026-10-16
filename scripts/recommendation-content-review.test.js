import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {knowledgeContentHash,validateKnowledgeUnit} from './recommendation-knowledge.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${n}`,import.meta.url),'utf8'));
const units=[...read('regional-drafts.json').units,...read('pressure-welding-drafts.json').units];
const batch=read('content-review-batch13.json');
const prior=[...read('technical-review-records.json').reviews,...read('content-review-records.json').reviews];

test('batch 13 completion counts only exact reviewed areas and preserves prior reviews',()=>{
  const all=[...prior,...batch.reviews];
  assert.equal(all.length,53);
  assert.equal(new Set(all.map(r=>`${r.unitId}:${r.area}`)).size,all.length);
  assert.equal(batch.completedReviewAreas,batch.reviews.length);
  assert.equal(batch.totalCompletedReviewAreasIncludingPrior,all.length);
  assert.deepEqual(['technical','regional','translation'].map(a=>all.filter(r=>r.area===a).length),[27,2,24]);
  const captures=read('guidance-source-captures.json').captures;
  for(const r of [...all,...batch.pendingRegionalReviews]){
    const u=units.find(u=>u.id===r.unitId);
    assert.equal(r.contentHash,knowledgeContentHash(u));
    assert.equal(r.sourceFingerprint,u.sourceFingerprint);
    assert.equal(r.approvalGranted,false);
    assert.equal(u.status,'draft');assert.equal(u.recommendationScore,null);
    assert.ok(validateKnowledgeUnit(u,{forPublication:true}).length);
    for(const e of r.evidence){const c=captures.find(c=>c.id===e.captureId);assert.equal(e.url,c.url);assert.deepEqual(e.fragments,c.fragments);for(const s of e.coveredSections)assert.ok(c.coveredSections.includes(s));}
  }
  for(const r of batch.reviews){
    assert.ok(r.rationale&&r.reviewedAtUtc&&r.reviewMethod&&r.checks.length&&r.remainingIssues.length);
    if(r.area==='regional')assert.ok(r.currentOfficialChecks.length&&r.currentOfficialChecks.every(c=>c.observedOn&&c.sections&&c.url.startsWith('https://')));
    if(r.area==='translation')assert.ok(r.semanticCheck&&r.comparedFields.includes('conditions')&&r.comparedFields.includes('exclusions'));
  }
  assert.equal(batch.pendingRegionalReviews.length,10);
  for(const r of batch.pendingRegionalReviews){assert.equal(r.decision,null);assert.equal(r.countedComplete,false);assert.ok(r.requiredToComplete);}
});

test('batch 13 correction history reconstructs the exact prior draft and binds new citation scope',()=>{
  assert.equal(batch.corrections.length,10);
  for(const c of batch.corrections){
    const u=units.find(u=>u.id===c.unitId),old=structuredClone(u);
    for(const [key,v]of Object.entries(c.changes)){assert.deepEqual(u[key],v.after);old[key]=v.before;}
    assert.equal(knowledgeContentHash(old),c.previousContentHash);
    assert.equal(knowledgeContentHash(u),c.contentHash);
    assert.equal(u.sourceFingerprint,c.sourceFingerprint);
    assert.equal(c.revision,c.previousRevision+1);
  }
  const expansion=batch.sourceMetadataExpansion;
  const capture=read('guidance-source-captures.json').captures.find(c=>c.id===expansion.captureId);
  assert.deepEqual(capture.coveredSections,[...expansion.previousCoveredSections,expansion.addedCoveredSection]);
  assert.equal(expansion.fragmentBytesChanged,false);
  for(const id of ['regional-us-maintenance','regional-us-pressure-filter']){
    const u=units.find(u=>u.id===id),c=batch.corrections.find(c=>c.unitId===id);
    assert.equal(u.sources[0].section,expansion.addedCoveredSection);
    assert.notEqual(u.sourceFingerprint,c.previousSourceFingerprint);
  }
});
