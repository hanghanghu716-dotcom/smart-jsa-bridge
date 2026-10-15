import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fixtureCaseRelease } from './analysis-fixture/caseRelease.js';
import { contentFingerprint } from './case-build-data.js';
import { caseSourceFingerprint } from '../src/utils/caseSource.js';
import { caseCandidates, caseStepOptions, caseJourneyState, selectCaseRecommendations, loadCaseRecommendations } from '../src/utils/caseRecommendations.js';
import { reconcileProcedureAnalysis } from '../src/utils/procedureAnalysis.js';
import { applyControl, updateRiskValue } from '../src/utils/analysisRecommendations.js';
import { verifyRecommendationRelease } from './recommendation-release.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { caseRecommendationUi } from '../src/locales/caseRecommendationUi.js';

const example = (locale = 'en-US') => {
  const f = fixtureCaseRelease(locale);
  const candidates = caseCandidates(f.manifest, f.post, f.sourceFingerprint, f.context);
  const state = caseJourneyState(f.manifest, candidates, [caseStepOptions(candidates)[0].key], ['isolated-task'], f.context, 'A4');
  return { ...f, candidates, state, args: { risk: state.analysisData[0].risks[0], type: 'current', formData: state.formData, proc: state.procedures[0], fingerprint: f.sourceFingerprint } };
};

test('production release contains no synthetic or unreviewed data and its hashes verify', () => {
  const release = JSON.parse(fs.readFileSync(new URL('../src/data/reviewed-recommendations.json', import.meta.url)));
  assert.equal(verifyRecommendationRelease(release), true);
  assert.equal(JSON.stringify(release).includes('SYNTHETIC'), false);
  assert.equal(verifyRecommendationRelease(example().manifest), true);
  assert.throws(() => verifyRecommendationRelease({ ...example().manifest, contentHash: 'wrong' }), /hash/);
});

test('all 18 locales require selected steps and applicable conditions, then keep assessments blank', async () => {
  for (const locale of SUPPORTED_LANGS) {
    const { manifest, context, post, sourceFingerprint, candidates, state, args } = example(locale);
    assert.equal(await caseSourceFingerprint(post), contentFingerprint(post));
    assert.equal(sourceFingerprint, await caseSourceFingerprint(post));
    assert.equal(state.analysisData.length, 1);
    assert.equal(state.analysisData[0].riskLevel, null);
    assert.equal(state.analysisData[0].risks[0].current_measure_confirmed, false);
    assert.equal(selectCaseRecommendations(manifest, args)[0].similarity_score, .72);
    const selected = [caseStepOptions(candidates)[0].key];
    assert.equal(caseJourneyState(manifest, candidates, [], ['isolated-task'], context, 'A4'), null);
    assert.equal(caseJourneyState(manifest, candidates, selected, [], context, 'A4'), null);
    assert.equal(caseJourneyState(manifest, candidates, selected, ['isolated-task', 'live-intervention'], context, 'A4'), null);
    assert.deepEqual(caseCandidates(manifest, post, 'changed', context), []);
    assert.deepEqual(caseCandidates(manifest, post, sourceFingerprint, { ...context, jurisdiction: 'other' }), []);
    assert.deepEqual(caseCandidates(manifest, post, sourceFingerprint, { ...context, documentLocale: 'other' }), []);
    assert.ok(Object.values(caseRecommendationUi(locale)).every(value => typeof value === 'string' && value.trim()));
  }
});

test('advanced case recommendations retain the original hazard, task, source and confirmed current-control chain', () => {
  const { manifest, args } = example();
  const current = selectCaseRecommendations(manifest, args)[0];
  const risk = applyControl(args.risk, current, { type: 'current', jsaType: '3-step' });
  assert.deepEqual(selectCaseRecommendations(manifest, { ...args, risk, type: 'advanced' }), []);
  risk.current_measure_confirmed = true;
  assert.equal(selectCaseRecommendations(manifest, { ...args, risk, type: 'advanced' })[0].similarity_score, .8);
  for (const changed of [
    { fingerprint: 'new-source' }, { proc: { ...args.proc, stepDetail: 'Different task' } },
    { formData: { ...args.formData, context: { ...args.formData.context, activity: 'Different work' } } },
    { formData: { ...args.formData, caseJourney: { conditions: ['live-intervention'] } } },
    { risk: updateRiskValue(risk, 'factor', 'Different hazard') },
    { risk: { ...risk, current_measure: 'Different control' } },
    { risk: { ...risk, current_measure_reference: { ...risk.current_measure_reference, releaseId: 'old' } } },
  ]) assert.deepEqual(selectCaseRecommendations(manifest, { ...args, risk, type: 'advanced', ...changed }), []);
  assert.deepEqual(selectCaseRecommendations({ ...manifest, releaseId: 'next' }, args), []);
});

test('procedure edits preserve user text but invalidate references, confirmation and old ratings', () => {
  const { state } = example();
  const step = state.analysisData[0];
  const risk = { ...step.risks[0], current_measure: 'User text', recommend_measure: 'Further text', current_measure_confirmed: true,
    current_measure_reference: { kind: 'knowledge', id: 'old' } };
  const changed = reconcileProcedureAnalysis({ ...step, risks: [risk], frequency: 3, severity: 4, riskLevel: 12 }, { ...step.proc, stepTitle: 'New task' }, 0);
  assert.equal(changed.risks[0].current_measure, 'User text');
  assert.equal(changed.risks[0].recommend_measure, 'Further text');
  assert.equal(changed.risks[0].current_measure_reference, null);
  assert.equal(changed.risks[0].caseContext, null);
  assert.equal(changed.risks[0].current_measure_confirmed, false);
  assert.equal(changed.frequency, null); assert.equal(changed.severity, null); assert.equal(changed.riskLevel, null);
  assert.equal(reconcileProcedureAnalysis(undefined, step.proc, 0).riskLevel, null);
});

test('restored case recommendations recheck the live source and never treat a failed read as empty success', async () => {
  const { manifest, args, post } = example();
  let rows = [post], error = null, table;
  const client = { from(name) { table = name; const query = { select: () => query, eq: () => query,
    then: (resolve, reject) => Promise.resolve({ data: rows, error }).then(resolve, reject) }; return query; } };
  assert.equal((await loadCaseRecommendations(client, manifest, args))[0].similarity_score, .72);
  assert.equal(table, 'case_studies');
  rows = [{ ...post, content_md: 'Revised content' }];
  assert.deepEqual(await loadCaseRecommendations(client, manifest, args), []);
  rows = [post, post]; assert.deepEqual(await loadCaseRecommendations(client, manifest, args), []);
  error = Error('HTTP 522'); await assert.rejects(loadCaseRecommendations(client, manifest, args), /522/);
});
