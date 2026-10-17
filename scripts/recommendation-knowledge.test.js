import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reverseReviewCorrections} from './recommendation-review-history.js';
import { validateKnowledgeBank, validateKnowledgeUnit, knowledgeContentHash, bindKnowledgeSources } from './recommendation-knowledge.js';

const bank = JSON.parse(fs.readFileSync(new URL('../data/recommendation-knowledge/pilot.en-US.json', import.meta.url)));

test('recorded AI desk reviews match frozen content and evidence without granting publication approval', () => {
  const read = name => JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${name}`, import.meta.url)));
  const records = read('technical-review-records.json');
  const units = reverseReviewCorrections(reverseReviewCorrections(reverseReviewCorrections(reverseReviewCorrections(reverseReviewCorrections([...read('regional-drafts.json').units, ...read('pressure-welding-drafts.json').units,...read('pilot.en-US.json').units],read('content-review-batch21.json').corrections),read('content-review-batch19.json').corrections),read('content-review-batch18.json').corrections),read('content-review-batch17.json').corrections),read('content-review-batch16.json').corrections);
  const captures = read('guidance-source-captures.json').captures;
  assert.equal(records.releaseApproval, false);
  assert.equal(records.completedReviewAreas, records.reviews.length);
  assert.equal(records.publicationApprovals, 0);
  assert.equal(new Set(records.reviews.map(r => `${r.unitId}:${r.area}`)).size, records.reviews.length);
  for (const review of records.reviews) {
    const unit = units.find(u => u.id === review.unitId);
    assert.ok(unit, review.unitId);
    assert.equal(review.contentHash, knowledgeContentHash(unit), review.unitId);
    assert.equal(review.sourceFingerprint, unit.sourceFingerprint, review.unitId);
    assert.equal(review.approvalGranted, false);
    assert.match(review.reviewer, /AI/);
    assert.ok(review.rationale && review.reviewedAt && review.checks.length && review.remainingIssues.length);
    assert.ok(review.evidence.length);
    for (const evidence of review.evidence) {
      const capture = captures.find(c => c.id === evidence.captureId);
      assert.ok(capture, evidence.captureId);
      assert.equal(evidence.url, capture.url);
      assert.deepEqual(evidence.fragments, capture.fragments);
      for (const section of evidence.coveredSections) assert.ok(capture.coveredSections.includes(section));
    }
    assert.equal(unit.status, 'draft');
    assert.equal(unit.review.technicalStatus, 'pending');
    assert.ok(validateKnowledgeUnit(unit, { forPublication: true }).length);
  }
});

test('three pilot records are valid drafts and none can pass publication validation', () => {
  assert.equal(bank.units.length, 3);
  assert.deepEqual(validateKnowledgeBank(bank), []);
  assert.equal(validateKnowledgeBank(bank, { forPublication: true }).length, 3);
  assert.ok(bank.units.every(unit => unit.status === 'draft' && unit.recommendationScore === null));
});

test('content desk reviews cover exact revised text and do not count unfinished regional assessments', () => {
  const read = name => JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${name}`, import.meta.url)));
  const records = read('content-review-records.json');
  const prior = read('technical-review-records.json');
  const units = reverseReviewCorrections(reverseReviewCorrections(reverseReviewCorrections(reverseReviewCorrections(reverseReviewCorrections([...read('regional-drafts.json').units, ...read('pressure-welding-drafts.json').units,...read('pilot.en-US.json').units],read('content-review-batch21.json').corrections),read('content-review-batch19.json').corrections),read('content-review-batch18.json').corrections),read('content-review-batch17.json').corrections),read('content-review-batch16.json').corrections);
  const captures = read('guidance-source-captures.json').captures;
  const all = [...prior.reviews, ...records.reviews];
  assert.equal(new Set(all.map(r => `${r.unitId}:${r.area}`)).size, all.length);
  assert.equal(records.totalCompletedReviewAreasIncludingPrior, all.length);
  assert.equal(records.completedReviewAreas, records.reviews.length);
  assert.equal(records.releaseApproval, false);
  assert.equal(records.publicationApprovals, 0);
  assert.equal(records.reviews.filter(r=>r.area==='technical').length, 12);
  assert.equal(records.reviews.filter(r=>r.area==='translation').length, 12);
  for (const r of [...records.reviews,...records.pendingRegionalReviews]) {
    const u=units.find(u=>u.id===r.unitId);
    assert.equal(r.contentHash,knowledgeContentHash(u));
    assert.equal(r.sourceFingerprint,u.sourceFingerprint);
    assert.equal(r.approvalGranted,false);
    assert.equal(u.status,'draft');
    assert.ok(Object.entries(u.review).filter(([k])=>k.endsWith('Status')).every(([,v])=>v==='pending'));
    assert.ok(validateKnowledgeUnit(u,{forPublication:true}).length);
    assert.ok(r.evidence.length);
    for (const e of r.evidence) {
      const c=captures.find(c=>c.id===e.captureId);
      assert.equal(e.url,c.url);assert.deepEqual(e.fragments,c.fragments);
      for(const section of e.coveredSections) assert.ok(c.coveredSections.includes(section));
      if(e.captureId.includes('287n'))assert.equal(e.role,'temporal-context-only');
    }
    if(r.area==='regional') {
      assert.equal(r.decision,null);assert.equal(r.countedComplete,false);
      assert.ok(r.requiredToComplete&&r.findings.length);
    } else {
      assert.equal(r.decision,'completed_with_limitations');
      assert.ok(r.rationale&&r.checks.length>=3&&r.remainingIssues.length&&r.reviewedAtUtc);
      if(r.area==='translation')assert.ok(r.semanticBackTranslation&&r.comparedFields.includes('exclusions'));
    }
  }
  assert.equal(records.pendingRegionalReviews.length,12);
});

test('review corrections preserve previous content and match the revised dossier and bank', () => {
  const read = name => JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${name}`, import.meta.url)));
  const records=read('content-review-records.json');
  const dossiers=read('guidance-evidence-dossiers.json').dossiers;
  const units=reverseReviewCorrections(reverseReviewCorrections(reverseReviewCorrections(reverseReviewCorrections(reverseReviewCorrections([...read('regional-drafts.json').units,...read('pressure-welding-drafts.json').units,...read('pilot.en-US.json').units],read('content-review-batch21.json').corrections),read('content-review-batch19.json').corrections),read('content-review-batch18.json').corrections),read('content-review-batch17.json').corrections),read('content-review-batch16.json').corrections);
  assert.equal(records.corrections.length,5);
  for(const c of records.corrections) {
    const u=units.find(u=>u.id===c.unitId),d=dossiers.find(d=>d.unitId===c.unitId);
    const before=structuredClone(u);
    for(const [key,change] of Object.entries(c.changes)) {
      assert.deepEqual(u[key],change.after);before[key]=change.before;
    }
    assert.equal(c.previousContentHash,knowledgeContentHash(before));
    assert.equal(c.contentHash,knowledgeContentHash(u));
    assert.notEqual(c.previousContentHash,c.contentHash);
    assert.equal(c.revision,c.previousRevision+1);
    assert.equal(d.subsequentRevisions.at(-1).contentHash,c.previousContentHash);
    assert.deepEqual(Object.fromEntries(Object.keys(d.content).map(k=>[k,before[k]])),d.subsequentRevisions.at(-1).content);
  }
});

test('a recorded review must cover the exact content and source revision', () => {
  const unit = structuredClone(bank.units[0]);
  unit.sourceFingerprint = 'a'.repeat(64);
  unit.status = 'reviewed';
  // Synthetic fixture: this is not a review of the actual pilot content.
  unit.review = { technicalStatus: 'approved', regionalStatus: 'approved', translationStatus: 'approved', reviewer: 'TEST FIXTURE ONLY', reviewedAt: '2026-01-01', contentHash: knowledgeContentHash(unit) };
  assert.deepEqual(validateKnowledgeUnit(unit, { forPublication: true }), []);
  for (const field of ['regionalStatus', 'translationStatus']) {
    assert.ok(validateKnowledgeUnit({ ...unit, review: { ...unit.review, [field]: 'pending' } }, { forPublication: true }).some(error => error.includes('regional and translation')));
  }
  unit.control = 'Different control';
  assert.ok(validateKnowledgeUnit(unit, { forPublication: true }).some(error => error.includes('content revision')));
});

test('source changes invalidate approval and ambiguous source rows require resolution', () => {
  const original = { ...bank, units: [bank.units[0]] };
  const originalFingerprint = original.units[0].sourceFingerprint;
  const row = { id: 1, post_group_id: original.units[0].caseGroupId, language_code: 'en-US', content_md: 'First source edition' };
  const bound = bindKnowledgeSources(original, [row]);
  assert.match(bound.units[0].sourceFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(original.units[0].sourceFingerprint, originalFingerprint);
  bound.units[0].status = 'reviewed';
  const updated = bindKnowledgeSources(bound, [{ ...row, content_md: 'Revised source edition' }]);
  assert.equal(updated.units[0].status, 'draft');
  assert.equal(updated.units[0].review.technicalStatus, 'pending');
  assert.throws(() => bindKnowledgeSources(original, [row, row]), /found 2/);
});

test('extraction cannot manufacture scores or erase applicability conditions', () => {
  const bad = { ...bank.units[0], recommendationScore: 0.99, conditions: [], jurisdiction: 'unknown' };
  const errors = validateKnowledgeUnit(bad);
  assert.ok(errors.some(error => error.startsWith('recommendationScore')));
  assert.ok(errors.some(error => error.startsWith('conditions')));
  assert.ok(errors.some(error => error.startsWith('jurisdiction')));
});

test('regional drafts have complete condition labels but cannot be published without reviews', () => {
  const regional = JSON.parse(fs.readFileSync(new URL('../data/recommendation-knowledge/regional-drafts.json', import.meta.url)));
  assert.equal(regional.units.length, 19);
  assert.deepEqual(validateKnowledgeBank(regional), []);
  assert.equal(validateKnowledgeBank(regional, { forPublication: true }).length, 19);
  const unit = structuredClone(bank.units[0]);
  delete unit.conditionLabels[unit.applicability.conditionsRequired[0]];
  assert.ok(validateKnowledgeUnit(unit).some(error => error.startsWith('conditionLabels')));
  unit.applicability.excludedConditions.push(unit.applicability.conditionsRequired[0]);
  assert.ok(validateKnowledgeUnit(unit).some(error => error.includes('contradictory')));
});

