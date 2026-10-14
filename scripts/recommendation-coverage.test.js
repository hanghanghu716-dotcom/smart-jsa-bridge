import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { buildKnowledgeCoverage, sourceRelationship, readKnowledgeCoverage } from './recommendation-coverage.js';
import { validateKnowledgeBank, knowledgeContentHash } from './recommendation-knowledge.js';
import { compileRecommendationRelease, mappingContentHash } from './recommendation-release.js';
import { selectReviewedRecommendations } from '../src/utils/reviewedRecommendationPolicy.js';

const bank = JSON.parse(fs.readFileSync(new URL('../data/recommendation-knowledge/pressure-welding-drafts.json', import.meta.url)));

test('pressure and welding have exact-locale drafts, explicit limitations and no releasable scores', () => {
  assert.equal(bank.units.length, SUPPORTED_LANGS.length * 2);
  assert.deepEqual(validateKnowledgeBank(bank), []);
  assert.equal(validateKnowledgeBank(bank, { forPublication: true }).length, bank.units.length);
  for (const locale of SUPPORTED_LANGS) {
    const units = bank.units.filter(unit => unit.locale === locale);
    assert.deepEqual(units.map(unit => unit.applicability.taskType).sort(), ['pressure-equipment-opening', 'welding-exposure']);
    for (const unit of units) {
      assert.ok(unit.coverageLimit.length > 10);
      assert.equal(unit.recommendationScore, null);
      assert.equal(unit.sourceFingerprint, null);
      assert.equal(unit.review.technicalStatus, 'pending');
      assert.equal(unit.review.regionalStatus, 'pending');
      assert.equal(unit.review.translationStatus, 'pending');
      assert.ok(unit.applicability.excludedConditions.includes('confined-entry'));
      if (unit.applicability.taskType === 'pressure-equipment-opening') {
        assert.equal(unit.applicability.targetType, 'compressed-air-filter');
        assert.ok(unit.applicability.excludedConditions.includes('pressurized-intervention'));
        assert.ok(unit.applicability.conditionsRequired.includes('compressed-air-filter-identified'));
      } else {
        assert.equal(unit.applicability.targetType, 'uncoated-mild-steel-weld');
        assert.ok(unit.applicability.conditionsRequired.includes('regular-indoor-welding'));
        assert.ok(unit.applicability.excludedConditions.includes('outdoor-welding'));
        assert.ok(unit.applicability.excludedConditions.includes('coated-stainless-or-unknown-metal'));
      }
    }
  }
  assert.match(bank.units.find(unit => unit.locale === 'ko').task, /압축공기/);
});

test('source geography does not turn foreign, national or unread references into local evidence', () => {
  const source = { jurisdiction: 'CA', retrieval: 'relevant_primary_sections_read' };
  assert.equal(sourceRelationship(source, 'CA'), 'sameJurisdiction');
  assert.equal(sourceRelationship(source, 'CA-AB'), 'nationalReference');
  assert.equal(sourceRelationship(source, 'SG'), 'foreignReference');
  assert.equal(sourceRelationship({ ...source, jurisdiction: 'AU-VIC' }, 'AU'), 'subnationalReference');
  assert.equal(sourceRelationship({ ...source, jurisdiction: undefined }, 'CA'), 'unspecified');
  assert.equal(sourceRelationship({ ...source, evidenceRole: 'lead' }, 'CA'), 'unreadOrMetadata');
  assert.equal(sourceRelationship({ ...source, retrieval: 'primary_search_metadata_full_text_timeout' }, 'CA'), 'unreadOrMetadata');
});

test('a synthetic 99% score cannot bypass any new task exclusion or required condition in any Locale', () => {
  assert.throws(() => compileRecommendationRelease(bank, []), /Unreviewed/);
  for (const draft of bank.units) {
    // Test only: neither these approvals nor scores are persisted in any bank.
    const unit = structuredClone(draft);
    unit.status = 'reviewed'; unit.sourceFingerprint = 'a'.repeat(64);
    unit.review = { technicalStatus: 'approved', regionalStatus: 'approved', translationStatus: 'approved', reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-10-14', contentHash: knowledgeContentHash(unit) };
    const mapping = { unitId: unit.id, kind: 'current', score: { kind: 'text_similarity', value: .99, locale: unit.locale, model: 'synthetic-test', modelVersion: '1', generatedAt: '2026-10-14' } };
    mapping.review = { status: 'approved', reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-10-14', contentHash: knowledgeContentHash(unit), mappingHash: mappingContentHash(mapping) };
    const release = compileRecommendationRelease({ schemaVersion: 1, units: [unit] }, [mapping], { releaseId: 'synthetic-test-only', sourceFingerprints: { [unit.id]: unit.sourceFingerprint } });
    const query = { kind: 'current', documentLocale: unit.locale, jurisdiction: unit.jurisdiction, ...unit.applicability, conditions: [...unit.applicability.conditionsRequired] };
    assert.equal(selectReviewedRecommendations(release, query)[0].score.value, .99);
    for (const excluded of unit.applicability.excludedConditions) {
      assert.deepEqual(selectReviewedRecommendations(release, { ...query, conditions: [...query.conditions, excluded] }), [], `${unit.id}: ${excluded}`);
    }
    for (const required of unit.applicability.conditionsRequired) {
      assert.deepEqual(selectReviewedRecommendations(release, { ...query, conditions: query.conditions.filter(condition => condition !== required) }), [], `${unit.id}: missing ${required}`);
    }
    for (const key of ['documentLocale', 'jurisdiction', 'taskType', 'hazardType', 'targetType']) {
      assert.deepEqual(selectReviewedRecommendations(release, { ...query, [key]: 'wrong-context' }), [], `${unit.id}: ${key}`);
    }
  }
});

test('coverage counts exact task and jurisdiction, preserving missing cells and review gaps', () => {
  const report = buildKnowledgeCoverage([bank]);
  assert.equal(report.totals.locales, 18);
  assert.equal(report.totals.priorityCells, 54);
  assert.equal(report.totals.missingCells, 18);
  assert.equal(report.totals.cellsWithPublicationEligibleContent, 0);
  const sg = report.coverage.find(row => row.locale === 'en-SG').tasks.find(task => task.taskType === 'welding-exposure');
  assert.equal(sg.primarySourceReferences.foreignReference, 1);
  assert.equal(sg.missingSameJurisdictionPrimaryReference, true);
  assert.equal(sg.requiresLocalSourceReview, true);
  const alberta = report.coverage.find(row => row.locale === 'en-CA-AB').tasks.find(task => task.taskType === 'pressure-equipment-opening');
  assert.equal(alberta.primarySourceReferences.nationalReference, 1);
  assert.equal(alberta.primarySourceReferences.sameJurisdiction, 0);
  const japan = report.coverage.find(row => row.locale === 'ja-JP').tasks.find(task => task.taskType === 'welding-exposure');
  assert.equal(japan.primarySourceReferences.sameJurisdiction, 1);
  assert.equal(japan.missingSameJurisdictionPrimaryReference, false);
  assert.equal(japan.requiresLocalSourceReview, true, 'A local source cannot approve its own regional applicability');
});

test('duplicate revisions are rejected and retirement cannot resurrect an old approved version', () => {
  const unit = structuredClone(bank.units[0]);
  assert.throws(() => buildKnowledgeCoverage([{ schemaVersion: 1, units: [unit] }, { schemaVersion: 1, units: [unit] }]), /Duplicate/);
  unit.status = 'reviewed'; unit.sourceFingerprint = 'a'.repeat(64);
  unit.review = { technicalStatus: 'approved', regionalStatus: 'approved', translationStatus: 'approved', reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-10-14', contentHash: knowledgeContentHash(unit) };
  const approved = { schemaVersion: 1, units: [unit] };
  assert.equal(buildKnowledgeCoverage([approved]).totals.cellsWithPublicationEligibleContent, 1);
  const retired = { ...structuredClone(unit), revision: 2, status: 'retired' };
  assert.equal(buildKnowledgeCoverage([approved, { schemaVersion: 1, units: [retired] }]).totals.activeUnits, 0);
  unit.control += ' changed';
  assert.throws(() => buildKnowledgeCoverage([approved]), /content revision/);
});

test('committed coverage stays synchronized with all authored knowledge banks', async () => {
  const expected = await readKnowledgeCoverage();
  const stored = JSON.parse(fs.readFileSync(new URL('../docs/recommendation-task-coverage.json', import.meta.url)));
  assert.deepEqual(stored, expected);
  assert.equal(expected.totals.cellsWithPublicationEligibleContent, 0);
});
