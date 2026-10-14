import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentProfile, assessedScore, changeAssessmentProfile } from '../src/utils/analysisAssessment.js';
test('unassessed and out-of-range inputs cannot become low-risk scores', () => {
  assert.equal(assessedScore(null, 1), null);
  assert.equal(assessedScore('', 1), null);
  assert.equal(assessedScore(0, 1), null);
  assert.equal(assessedScore(1, 5, { severityMax: 4 }), null);
  assert.equal(assessedScore(3, 4, { severityMax: 4 }), 12);
});
test('changing site criteria preserves history but requires reassessment', () => {
  const prior = [{ id: 1, frequency: 2, severity: 4, riskLevel: 8, risks: [{ factor: 'Keep my text' }] }];
  const before = assessmentProfile(), after = assessmentProfile({ severityMax: 4, highFrom: 8, criteria: 'Site procedure A' });
  const next = changeAssessmentProfile(prior, before, after);
  assert.equal(next[0].riskLevel, null);
  assert.equal(next[0].previousAssessment.riskLevel, 8);
  assert.deepEqual(next[0].risks, prior[0].risks);
  assert.equal(prior[0].riskLevel, 8);
  assert.equal(changeAssessmentProfile(prior, before, before), prior);
  assert.equal(after.criteria, 'Site procedure A');
});
