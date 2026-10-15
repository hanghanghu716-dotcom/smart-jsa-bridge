import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentProfile, assessedScore, changeAssessmentProfile, unacceptableRiskScore, riskProgressBlock } from '../src/utils/analysisAssessment.js';
test('unassessed and out-of-range inputs cannot become low-risk scores', () => {
  assert.equal(assessedScore(null, 1), null);
  assert.equal(assessedScore('', 1), null);
  assert.equal(assessedScore(0, 1), null);
  assert.equal(assessedScore(1, 5, { severityMax: 4 }), null);
  assert.equal(assessedScore(3, 4, { severityMax: 4 }), 12);
});
test('5 by 5 progression accepts 15 and rejects 16, 20 and 25 independently of highlight colour', () => {
  assert.equal(unacceptableRiskScore(3, 5), null);
  assert.equal(unacceptableRiskScore(4, 4), 16);
  assert.equal(unacceptableRiskScore(4, 5), 20);
  assert.equal(unacceptableRiskScore(5, 5, { highFrom: 25 }), 25);
  assert.equal(unacceptableRiskScore(4, 4, { highFrom: 25 }), 16);
  assert.equal(unacceptableRiskScore(null, 5), null);
  assert.equal(unacceptableRiskScore(6, 5), null);
  assert.equal(unacceptableRiskScore(5, 4, { severityMax: 4 }), null);
});
test('next-step and completion guards recompute scores and inspect hidden earlier steps', () => {
  const steps = [
    { frequency: 4, severity: 5, riskLevel: 1 },
    { frequency: 3, severity: 5, riskLevel: 25 },
  ];
  assert.deepEqual(riskProgressBlock(steps, 0), { index: 0, score: 20, limit: 15 });
  assert.equal(riskProgressBlock(steps, 1), null);
  assert.deepEqual(riskProgressBlock(steps, 1, {}, true), { index: 0, score: 20, limit: 15 });
  steps[0].frequency = 3;
  assert.equal(riskProgressBlock(steps, 1, {}, true), null);
  assert.equal(riskProgressBlock([], 0, {}, true), null);
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
