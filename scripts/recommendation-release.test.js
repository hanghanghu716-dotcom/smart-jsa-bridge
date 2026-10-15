import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateKnowledgeBank, knowledgeContentHash } from './recommendation-knowledge.js';
import { compileRecommendationRelease, mappingContentHash } from './recommendation-release.js';
import { selectReviewedRecommendations } from '../src/utils/reviewedRecommendationPolicy.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
const drafts = JSON.parse(fs.readFileSync(new URL('../data/recommendation-knowledge/regional-drafts.json', import.meta.url)));

test('18 regional drafts cover each Locale but cannot be published without actual content and regional reviews', () => {
  assert.deepEqual(drafts.units.map(x => x.locale).sort(), SUPPORTED_LANGS.filter(locale => locale !== 'ro-RO').sort());
  assert.deepEqual(validateKnowledgeBank(drafts), []);
  assert.equal(validateKnowledgeBank(drafts, { forPublication: true }).length, 18);
  assert.throws(() => compileRecommendationRelease(drafts, []), /Unreviewed/);
});

// Approvals below are synthetic test fixtures, never written into the draft bank.
function releaseFixture() {
  const unit = structuredClone(drafts.units[0]);
  unit.status = 'reviewed'; unit.sourceFingerprint = 'a'.repeat(64);
  unit.review = { technicalStatus: 'approved', regionalStatus: 'approved', translationStatus: 'approved', reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-01-01', contentHash: knowledgeContentHash(unit) };
  const score = { kind: 'text_similarity', value: .72, locale: unit.locale, model: 'fixture', modelVersion: '1', generatedAt: '2026-01-01' };
  const mapping = { unitId: unit.id, kind: 'current', score };
  mapping.review = { status: 'approved', reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-01-01', contentHash: knowledgeContentHash(unit), mappingHash: mappingContentHash(mapping) };
  const bank = { schemaVersion: 1, units: [unit] };
  const options = { releaseId: 'synthetic-fixture', sourceFingerprints: { [unit.id]: unit.sourceFingerprint } };
  const query = { kind: 'current', documentLocale: unit.locale, jurisdiction: unit.jurisdiction, ...unit.applicability, conditions: [...unit.applicability.conditionsRequired] };
  return { unit, bank, mapping, options, query };
}

test('applicability gates reject wrong jurisdiction, task, hazard, target, missing conditions and exclusions before ranking', () => {
  const { bank, mapping, options, query } = releaseFixture();
  const release = compileRecommendationRelease(bank, [mapping], options);
  assert.equal(selectReviewedRecommendations(release, query)[0].score.value, .72);
  for (const key of ['documentLocale', 'jurisdiction', 'taskType', 'hazardType', 'targetType']) assert.deepEqual(selectReviewedRecommendations(release, { ...query, [key]: 'other' }), []);
  assert.deepEqual(selectReviewedRecommendations(release, { ...query, conditions: [] }), []);
  assert.deepEqual(selectReviewedRecommendations(release, { ...query, conditions: [...query.conditions, 'live-intervention'] }), []);
  assert.equal(selectReviewedRecommendations(release, query).length, 1, 'Do not pad a short result to three');
});

test('changed source, changed score, duplicate mappings, and a broken advanced-control chain cannot form a release', () => {
  const { unit, bank, mapping, options } = releaseFixture();
  assert.throws(() => compileRecommendationRelease(bank, [mapping], { ...options, sourceFingerprints: { [unit.id]: 'b'.repeat(64) } }), /changed source/);
  assert.throws(() => compileRecommendationRelease(bank, [{ ...mapping, score: { ...mapping.score, value: .99 } }], options), /Reviewed mapping/);
  assert.throws(() => compileRecommendationRelease(bank, [mapping, mapping], options), /Duplicate/);
  const advanced = { ...mapping, kind: 'advanced', currentControlId: 'foreign-control' };
  advanced.review = { ...mapping.review, mappingHash: mappingContentHash(advanced) };
  assert.throws(() => compileRecommendationRelease(bank, [advanced], options), /incompatible context/);
});
