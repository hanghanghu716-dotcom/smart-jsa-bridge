import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateKnowledgeBank, validateKnowledgeUnit, knowledgeContentHash, bindKnowledgeSources } from './recommendation-knowledge.js';

const bank = JSON.parse(fs.readFileSync(new URL('../data/recommendation-knowledge/pilot.en-US.json', import.meta.url)));

test('three pilot records are valid drafts and none can pass publication validation', () => {
  assert.equal(bank.units.length, 3);
  assert.deepEqual(validateKnowledgeBank(bank), []);
  assert.equal(validateKnowledgeBank(bank, { forPublication: true }).length, 3);
  assert.ok(bank.units.every(unit => unit.status === 'draft' && unit.recommendationScore === null));
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
  assert.equal(regional.units.length, 18);
  assert.deepEqual(validateKnowledgeBank(regional), []);
  assert.equal(validateKnowledgeBank(regional, { forPublication: true }).length, 18);
  const unit = structuredClone(bank.units[0]);
  delete unit.conditionLabels[unit.applicability.conditionsRequired[0]];
  assert.ok(validateKnowledgeUnit(unit).some(error => error.startsWith('conditionLabels')));
  unit.applicability.excludedConditions.push(unit.applicability.conditionsRequired[0]);
  assert.ok(validateKnowledgeUnit(unit).some(error => error.includes('contradictory')));
});
