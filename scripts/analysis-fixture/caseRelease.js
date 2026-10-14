// Node-only fixture compiler. Synthetic approvals never enter production data.
import { fixtureCasePost } from './casePost.js';
import { fixtureText } from './text.js';
import { contentFingerprint } from '../case-build-data.js';
import { knowledgeContentHash } from '../recommendation-knowledge.js';
import { compileRecommendationRelease, mappingContentHash } from '../recommendation-release.js';
import { journeyContext } from '../../src/utils/regionalJourney.js';

export function fixtureCaseRelease(locale = 'en-US') {
  const post = fixtureCasePost(locale), words = fixtureText[locale.split('-')[0]], context = journeyContext(locale, post.title);
  const sourceFingerprint = contentFingerprint(post);
  const base = { id: `SYNTHETIC-CURRENT-${locale}`, caseGroupId: post.post_group_id, locale,
    jurisdiction: context.jurisdiction, task: words[0], step: words[0], hazard: words[0], cause: words[0], consequence: words[0],
    control: words[1], verification: words[2], sourceRevision: 'SYNTHETIC-v1', revision: 1, status: 'reviewed', sourceFingerprint,
    conditions: [words[0]], exclusions: [words[2]], keywords: [words[0]], recommendationScore: null,
    sources: [{ url: 'https://example.com/synthetic-test', section: 'SYNTHETIC TEST SOURCE' }],
    applicability: { taskType: 'pressure-maintenance', hazardType: 'pressure', targetType: 'line', conditionsRequired: ['isolated-task'], excludedConditions: ['live-intervention'] },
    conditionLabels: { 'isolated-task': words[0], 'live-intervention': words[2] } };
  const units = [base, { ...base, id: `SYNTHETIC-ADVANCED-${locale}`, control: words[2] }];
  for (const unit of units) unit.review = { technicalStatus: 'approved', regionalStatus: 'approved', translationStatus: 'approved',
    reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-01-01', contentHash: knowledgeContentHash(unit) };
  const mappings = units.map((unit, index) => {
    const mapping = { unitId: unit.id, kind: index ? 'advanced' : 'current', ...(index ? { currentControlId: units[0].id } : {}),
      score: { kind: 'text_similarity', value: index ? .8 : .72, locale, model: 'SYNTHETIC', modelVersion: '1', generatedAt: '2026-01-01' } };
    mapping.review = { status: 'approved', reviewer: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-01-01',
      contentHash: knowledgeContentHash(unit), mappingHash: mappingContentHash(mapping) };
    return mapping;
  });
  const manifest = compileRecommendationRelease({ schemaVersion: 1, units }, mappings, { releaseId: `SYNTHETIC-${locale}`, sourceFingerprints: Object.fromEntries(units.map(unit => [unit.id, sourceFingerprint])) });
  return { manifest, context, post, sourceFingerprint };
}
