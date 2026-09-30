import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeKnowledgeRisks, matchingProjectSteps } from '../src/utils/analysisKnowledge.js';

const target = { id: 0, proc: { stepTitle: 'Today' }, frequency: 2, severity: 3, riskLevel: 6,
  risks: [{ id: 'old', factor: ' Fire  hazard ', current_measure: 'Keep my edit' }] };
const source = { frequency: 5, severity: 5, riskLevel: 25, risks: [
  { id: 'duplicate', factor: 'Ｆｉｒｅ hazard', current_measure: 'Do not overwrite' },
  { id: 'new', factor: 'Fumes', current_measure: 'Ventilate', recommend_measure: 'Extract at source', current_measure_db_id: 42 },
  { id: 'twice', factor: ' fumes ' }, { factor: ' ' }
] };

test('full import skips normalized duplicates, preserves assessment and records provenance', () => {
  const before = JSON.stringify([target, source]);
  const result = mergeKnowledgeRisks(target, source, { jsaType: '3-step', makeId: () => 'fresh', sourceMeta: { type: 'project', projectId: 'p1', stepIndex: 4, label: 'Original · 5' } });
  assert.equal(result.added, 1); assert.equal(result.skipped, 3);
  assert.equal(result.step.riskLevel, 6); assert.equal(result.step.frequency, 2);
  assert.equal(result.step.risks[0].current_measure, 'Keep my edit');
  assert.deepEqual(result.step.proc, target.proc);
  const imported = result.step.risks[1];
  assert.equal(imported.id, 'fresh'); assert.equal(imported.sourceRiskId, 'new');
  assert.equal(imported.sourceProjectId, 'p1'); assert.equal(imported.sourceStepIndex, 4);
  assert.equal(imported.current_measure, 'Ventilate'); assert.equal(imported.recommend_measure, 'Extract at source');
  assert.equal(JSON.stringify([target, source]), before);
  assert.equal(mergeKnowledgeRisks(result.step, source).added, 0);
});

test('hazards-only strips controls and control linkage even when legacy risk fields exist', () => {
  const result = mergeKnowledgeRisks(target, { risks: [{ factor: 'Fall', measure: 'Old', current_measure: 'Old', recommend_measure: 'Old', current_measure_db_id: 1, advanced_measure_db_id: 2, sourceProjectId: 'stale' }] }, { mode: 'hazards', makeId: () => 'new' });
  const r = result.step.risks[1];
  assert.equal(r.measure, ''); assert.equal(r.current_measure, ''); assert.equal(r.recommend_measure, '');
  assert.equal(r.current_measure_db_id, undefined); assert.equal(r.advanced_measure_db_id, undefined);
  assert.equal(r.sourceProjectId, null);
});

test('two-step import retains both current and recommended control text', () => {
  const r = mergeKnowledgeRisks(target, source, { jsaType: '2-step' }).step.risks[1];
  assert.equal(r.measure, 'Ventilate\nExtract at source');
  assert.equal(r.current_measure, ''); assert.equal(r.recommend_measure, '');
});

test('three-step import maps a legacy combined measure to current controls', () => {
  const r = mergeKnowledgeRisks(target, { risks: [{ risk_factor: 'Noise', measure: 'Hearing protection' }] }, { jsaType: '3-step' }).step.risks[1];
  assert.equal(r.factor, 'Noise'); assert.equal(r.current_measure, 'Hearing protection');
});

test('project title search keeps its steps visible and hazard search keeps original step numbers', () => {
  const p = { title: 'Pipe maintenance', tags: ['Repair'], analysis_data: [
    { proc: { stepTitle: 'Prepare' }, risks: [] },
    { proc: { stepTitle: 'Weld' }, risks: [{ factor: 'Fumes', current_measure: 'Ventilate' }] }
  ] };
  assert.equal(matchingProjectSteps(p, 'PIPE').length, 2);
  assert.equal(matchingProjectSteps(p, 'repair').length, 2);
  assert.deepEqual(matchingProjectSteps(p, 'ventilate').map(x => x.index), [1]);
  assert.deepEqual(matchingProjectSteps(p, 'absent'), []);
  assert.deepEqual(matchingProjectSteps(null, ''), []);
});
