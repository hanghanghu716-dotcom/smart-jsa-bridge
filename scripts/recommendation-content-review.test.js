import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {knowledgeContentHash,validateKnowledgeUnit} from './recommendation-knowledge.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${n}`,import.meta.url),'utf8'));
const units=[...read('regional-drafts.json').units,...read('pressure-welding-drafts.json').units,...read('pilot.en-US.json').units];
const batch=read('content-review-batch13.json');
const prior=[...read('technical-review-records.json').reviews,...read('content-review-records.json').reviews];
const batch14=read('content-review-batch14.json');
const batch15=read('content-review-batch15.json');

test('batch 15 closes every technical and terminology area without counting pending regional work',()=>{
  const all=[...prior,...batch.reviews,...batch14.reviews,...batch15.reviews];
  assert.equal(all.length,123);
  assert.equal(new Set(all.map(r=>`${r.unitId}:${r.area}`)).size,123);
  assert.deepEqual(['technical','regional','translation'].map(a=>all.filter(r=>r.area===a).length),[60,3,60]);
  assert.equal(batch15.reviews.length,51);assert.equal(batch15.pendingRegionalReviews.length,27);
  for(const u of units){
    for(const area of ['technical','translation'])assert.equal(all.filter(r=>r.unitId===u.id&&r.area===area).length,1);
    assert.equal(u.status,'draft');assert.equal(u.recommendationScore,null);
    for(const area of ['technical','regional','translation'])assert.equal(u.review[`${area}Status`],'pending');
    assert.ok(validateKnowledgeUnit(u,{forPublication:true}).length);
  }
  const captures=read('guidance-source-captures.json').captures;
  for(const r of [...all,...batch15.pendingRegionalReviews]){
    const u=units.find(u=>u.id===r.unitId);
    assert.equal(r.contentHash,knowledgeContentHash(u));assert.equal(r.sourceFingerprint,u.sourceFingerprint);assert.equal(r.approvalGranted,false);
    for(const e of r.evidence){const c=captures.find(c=>c.id===e.captureId);assert.ok(c);assert.equal(e.url,c.url);assert.deepEqual(e.fragments,c.fragments);}
    if(u.caseGroupId){assert.equal(r.caseSourceEvidence.sourceFingerprint,u.sourceFingerprint);assert.equal(r.caseSourceEvidence.sourceRowId,u.sourceRowId);}
    else assert.ok(r.evidence.length);
  }
  for(const r of batch15.reviews){assert.ok(r.rationale&&r.reviewMethod&&r.reviewedAtUtc&&r.checks.length&&r.remainingIssues.length);if(r.area==='translation')assert.equal(r.comparedFields.length,10);}
  for(const r of batch15.pendingRegionalReviews){assert.equal(r.decision,null);assert.equal(r.countedComplete,false);assert.ok(r.requiredToComplete);assert.ok(!all.some(x=>x.unitId===r.unitId&&x.area==='regional'));}
});

test('batch 15 corrections reconstruct previous content and retain source identity and hold points',()=>{
  assert.equal(batch15.corrections.length,23);
  for(const c of batch15.corrections){
    const u=units.find(u=>u.id===c.unitId),old=structuredClone(u);
    for(const [k,v]of Object.entries(c.changes)){assert.deepEqual(u[k],v.after);old[k]=v.before;}
    assert.equal(knowledgeContentHash(old),c.previousContentHash);assert.equal(knowledgeContentHash(u),c.contentHash);
    assert.equal(u.sourceFingerprint,c.previousSourceFingerprint);assert.equal(c.sourceFingerprint,u.sourceFingerprint);assert.equal(c.revision,c.previousRevision+1);
    assert.deepEqual(u.conditions,u.applicability.conditionsRequired.map(k=>u.conditionLabels[k]));assert.deepEqual(u.exclusions,u.applicability.excludedConditions.map(k=>u.conditionLabels[k]));
  }
  const get=id=>units.find(u=>u.id===id);
  assert.match(get('asphalt-milling-truck-exchange').verification,/Hold milling, discharge and vehicle movement/);
  assert.match(get('compressed-air-filter-backfeed').control,/personal locks/);
  assert.match(get('regional-fr-pressure-filter').verification,/absence de bruit ou d’écoulement/);
  assert.match(get('regional-au-maintenance').verification,/unsuccessful restart test alone/);
  assert.match(get('regional-de-maintenance').coverageLimit,/Störungsbeseitigung/);
  for(const suffix of ['maintenance','pressure-filter','welding-fume'])assert.match(get(`regional-ro-${suffix}`).conditionLabels['confined-entry'],/spațiu confinat/);
  assert.match(get('aluminum-tig-air-exposure').verification,/hold welding and recheck both/);
});

test('case evidence distinguishes exact AI-authored source extraction from primary technical corroboration',()=>{
  const e=read('content-review-case-evidence.json');assert.equal(e.cases.length,3);assert.equal(e.sourceReadOnly,true);assert.equal(e.sourceProfessionalApproval,false);
  for(const c of e.cases){const u=units.find(u=>u.id===c.unitId);assert.equal(c.sourceFingerprint,u.sourceFingerprint);assert.equal(c.sourceRowId,u.sourceRowId);assert.equal(c.locale,u.locale);assert.equal(c.caseGroupId,u.caseGroupId);assert.equal(c.url,u.sources[0].url);assert.ok(c.sectionsRead);assert.equal(u.origin.sourceProfessionalApproval,false);}
  assert.equal(e.additionalTechnicalChecks.length,3);
  for(const c of e.additionalTechnicalChecks){assert.ok(c.url.startsWith('https://')&&c.sections&&c.finding&&c.retrievalRef);assert.ok(units.find(u=>u.id===c.unitId).sourceCheck.supportingReferences.some(s=>s.url===c.url));}
});

test('batch 14 completion preserves all earlier hashes and excludes incomplete regional assessments',()=>{
  const all=[...prior,...batch.reviews,...batch14.reviews];
  assert.equal(all.length,72);
  assert.equal(new Set(all.map(r=>`${r.unitId}:${r.area}`)).size,72);
  assert.equal(batch14.completedReviewAreas,19);
  assert.equal(batch14.totalCompletedReviewAreasIncludingPrior,72);
  assert.deepEqual(['technical','regional','translation'].map(a=>all.filter(r=>r.area===a).length),[36,3,33]);
  const captures=read('guidance-source-captures.json').captures;
  for(const r of [...all,...batch14.pendingRegionalReviews]){
    const u=units.find(u=>u.id===r.unitId);
    assert.equal(r.contentHash,knowledgeContentHash(u));assert.equal(r.sourceFingerprint,u.sourceFingerprint);
    assert.equal(r.approvalGranted,false);assert.equal(u.status,'draft');assert.equal(u.recommendationScore,null);
    for(const area of ['technical','regional','translation'])assert.equal(u.review[`${area}Status`],'pending');
    for(const e of r.evidence){const c=captures.find(c=>c.id===e.captureId);assert.equal(e.url,c.url);assert.deepEqual(e.fragments,c.fragments);for(const s of e.coveredSections)assert.ok(c.coveredSections.includes(s));}
  }
  assert.equal(batch14.pendingRegionalReviews.length,8);
  for(const r of batch14.pendingRegionalReviews){assert.equal(r.decision,null);assert.equal(r.countedComplete,false);assert.ok(r.requiredToComplete);assert.ok(!batch14.reviews.some(x=>x.unitId===r.unitId&&x.area==='regional'));}
  for(const r of batch14.reviews){assert.ok(r.reviewedAtUtc&&r.reviewMethod&&r.rationale&&r.checks.length&&r.remainingIssues.length);if(r.area==='translation')assert.equal(r.comparedFields.length,10);if(r.area==='regional')assert.ok(r.currentOfficialChecks.length===2);}
});

test('batch 14 corrections preserve provenance and keep the Canadian isolation and ventilation safeguards',()=>{
  assert.equal(batch14.corrections.length,9);
  for(const c of batch14.corrections){
    const u=units.find(u=>u.id===c.unitId),old=structuredClone(u);
    for(const [key,v] of Object.entries(c.changes)){assert.deepEqual(u[key],v.after);old[key]=v.before;}
    assert.equal(knowledgeContentHash(old),c.previousContentHash);assert.equal(knowledgeContentHash(u),c.contentHash);
    assert.equal(u.sourceFingerprint,c.previousSourceFingerprint);assert.equal(c.sourceFingerprint,u.sourceFingerprint);
    assert.equal(c.revision,c.previousRevision+1);
    assert.deepEqual(u.conditions,u.applicability.conditionsRequired.map(c=>u.conditionLabels[c]));
    assert.deepEqual(u.exclusions,u.applicability.excludedConditions.map(c=>u.conditionLabels[c]));
    if(u.id.endsWith('pressure-filter')){assert.match(u.control,/personal lock/);assert.match(u.verification,/do not loosen the housing/);assert.ok(u.applicability.excludedConditions.includes('pressurized-intervention'));}
  }
  const bc=units.find(u=>u.id==='regional-ca-bc-maintenance');assert.ok(bc.applicability.conditionsRequired.includes('bc-regime-confirmed'));assert.match(bc.control,/key-securing system/);assert.match(bc.verification,/each worker/i);
  assert.match(units.find(u=>u.id==='regional-ca-ab-welding-fume').verification,/immediate ventilation-failure warning/);
  assert.match(units.find(u=>u.id==='regional-ca-bc-welding-fume').verification,/reviewed at least annually/);
});

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
