import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { knowledgeContentHash, validateKnowledgeUnit } from './recommendation-knowledge.js';
const root = new URL('../', import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL('data/recommendation-knowledge/' + name, root), 'utf8'));
const batch = read('content-review-batch20.json');
const prior = read('content-review-batch19.json');
const units = ['regional-drafts.json','pressure-welding-drafts.json','pilot.en-US.json'].flatMap(n => read(n).units);
test('partial evidence cannot inflate unique completed review areas', () => {
  const history = ['technical-review-records.json','content-review-records.json', ...Array.from({length:8}, (_,i) => 'content-review-batch' + (i+13) + '.json')].flatMap(n => read(n).reviews);
  const latest = new Map(history.map(r => [r.unitId + ':' + r.area, r]));
  assert.equal(latest.size, 170);
  assert.deepEqual(['technical','regional','translation'].map(a => [...latest.values()].filter(r => r.area === a).length), [60,50,60]);
  assert.equal(batch.totalCompletedReviewAreasIncludingPrior, latest.size);
  assert.equal(batch.completedReviewAreas, 0);
  assert.equal(batch.revalidatedReviewAreas, 0);
  assert.deepEqual(batch.reviews, []);
  assert.deepEqual(batch.corrections, []);
  assert.deepEqual(batch.pendingRegionalReviews.map(r => r.unitId).sort(), prior.pendingRegionalReviews.map(r => r.unitId).sort());
  for (const r of [...latest.values(), ...batch.pendingRegionalReviews]) {
    const u = units.find(u => u.id === r.unitId);
    assert.equal(r.contentHash, knowledgeContentHash(u));
    assert.equal(r.sourceFingerprint, u.sourceFingerprint);
  }
  for (const r of batch.pendingRegionalReviews) {
    assert.equal(latest.has(r.unitId + ':' + r.area), false);
    assert.equal(r.decision, null); assert.equal(r.countedComplete, false);
    assert.equal(r.legalCurrencyVerified, false); assert.equal(r.approvalGranted, false);
    assert.ok(r.requiredInputs.length && r.unresolvedLegalCheck && r.currentOfficialChecks.length);
  }
});
test('official selected-text snapshots are reproducible and distinguish raw files', () => {
  assert.equal(batch.officialEvidence.length, 3);
  for (const e of batch.officialEvidence) {
    assert.match(e.url, /^https:\/\/www\.law\.go\.kr\//);
    const bytes = fs.readFileSync(new URL(e.representationPath, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), e.representationSha256);
    assert.equal(bytes.length, e.representationUtf8Bytes);
    assert.equal(e.rawFileSha256, null);
    assert.equal(e.directFetchSucceeded, false);
    assert.ok(e.sections.length && e.retrievalRef && e.method);
  }
});
test('Korean annex progress preserves the unresolved exposure gate', () => {
  const r = batch.pendingRegionalReviews.find(r => r.unitId === 'regional-kr-welding-fume');
  assert.equal(r.resolvedSubchecks.length, 3);
  assert.match(r.unresolvedLegalCheck, /constituent-specific exposure/);
  assert.match(r.requiredToComplete, /averaging\/short-term and mixture/);
  assert.doesNotMatch(JSON.stringify(r), /16-2|16의2/);
  const annex17 = fs.readFileSync(new URL(batch.officialEvidence.find(e => e.id === 'kr-annex17').representationPath, root), 'utf8');
  assert.match(annex17, /0\.7 1\.0 1\.0 1\.2/);
  assert.match(annex17, /가장 먼 거리의 작업위치/);
  assert.equal(batch.unresolvedLegalChecks.length, 10);
  assert.ok(batch.unresolvedLegalChecks.every(r => r.countsAsLegalCompletion === false));
});
test('all drafts remain ineligible and later checklist stages remain untouched', () => {
  assert.equal(units.length, 60);
  for (const u of units) {
    assert.equal(u.status, 'draft'); assert.equal(u.recommendationScore, null);
    for (const a of ['technical','regional','translation']) assert.equal(u.review[a + 'Status'], 'pending');
    assert.ok(validateKnowledgeUnit(u, {forPublication:true}).length);
  }
  assert.equal(batch.releaseApproval, false);
  assert.equal(batch.publicationApprovals, 0);
  assert.deepEqual(batch.checklist.map(c => [c.completed,c.total]), [[57,57],[57,57],[170,180],[0,19],[0,4892],[0,6],[0,3],[0,19]]);
});

