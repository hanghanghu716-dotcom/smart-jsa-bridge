import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluationGroup, evaluationReviewHash, validateEvaluationSplits, evaluateRecommendationRanking } from './recommendation-evaluation.js';
test('translations and variants of one source cannot leak across evaluation partitions', () => {
  const sample = { sourceGroupId: 'same-original', groupVerified: true };
  assert.equal(evaluationGroup(sample.sourceGroupId), evaluationGroup(sample.sourceGroupId));
  assert.throws(() => validateEvaluationSplits({ tuning: [{ ...sample, locale: 'ko' }], held_out: [{ ...sample, locale: 'en-US' }] }), /leakage/);
  assert.throws(() => validateEvaluationSplits({ held_out: [{ ...sample, groupVerified: false }] }), /Verify canonical/);
});
test('unreviewed high scores do not become perfect accuracy or zero error', () => {
  const result = evaluateRecommendationRanking([{ id: 'x', relevant: true }], [{ queryId: 'q', sampleId: 'x', score: .99 }]);
  assert.equal(result.reviewCoverage, 0);
  assert.equal(result.precisionAt3AmongReviewed, null);
  assert.equal(result.highScoreErrorRate, null);
});
test('reviewed negative cases count as high-score errors and edited labels invalidate their review', () => {
  const sample = { id: 'x', queryId: 'q', groupVerified: true, sourceGroupId: 'fixture', task: 'SYNTHETIC TEST', relevant: false };
  sample.review = { status: 'approved', reviewer: 'TEST ONLY', reviewedAt: '2026-01-01', contentHash: evaluationReviewHash(sample) };
  const predictions = [{ queryId: 'q', sampleId: 'x', score: .99 }];
  assert.equal(evaluateRecommendationRanking([sample], predictions).highScoreErrorRate, 1);
  sample.relevant = true;
  assert.equal(evaluateRecommendationRanking([sample], predictions).highScoreErrorRate, null);
});
