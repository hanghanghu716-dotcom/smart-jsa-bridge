import test from 'node:test';
import assert from 'node:assert/strict';
import { actionPlan, isActionVerified, reusableActionStep, reconcileActionPlans, updateActionPlan } from '../src/utils/actionPlan.js';
import { defaultColumns, templateLayout } from '../src/utils/documentLayout.js';
import { riskProgressBlock, changeAssessmentProfile } from '../src/utils/analysisAssessment.js';
import { projectPayload, projectEditorState } from '../src/utils/projectPersistence.js';
import { importJsa, startWork, duplicatePackage } from '../src/utils/workPackages.js';
import { reconcileProcedureAnalysis } from '../src/utils/procedureAnalysis.js';
import { getActionPlanUi } from '../src/locales/actionPlanUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const plan = { additionalControls: 'Install a fixed guard', owner: 'Action owner', dueDate: '2026-10-17', status: 'implemented', completedOn: '2026-10-16', verifiedBy: 'Verifier', verifiedOn: '2026-10-17', effectiveness: 'effective', residualFrequency: 1, residualSeverity: 4 };
const step = { id: 0, proc: { stepTitle: 'Inspection', stepDetail: 'Work area' }, frequency: 4, severity: 5, riskLevel: 20, actionPlan: plan, risks: [{ factor: 'Moving part', measure: 'Isolate', current_measure: 'Isolate', recommend_measure: 'Guard' }] };

test('new 2/3-step tables position distinct additional controls after the initial rating; saved layouts remain exact', () => {
  for (const type of ['2-step', '3-step']) {
    const cols = defaultColumns(type);
    assert.equal(cols[cols.indexOf('DATA_RISK') + 1], type === '2-step' ? 'DATA_ADDITIONAL_CONTROLS' : 'DATA_RECOMMEND_MEASURE');
    assert.deepEqual(cols.slice(-3), ['DATA_ACTION_OWNER', 'DATA_ACTION_CHECK', 'DATA_RESIDUAL_RISK']);
    assert.equal(new Set(cols).size, cols.length);
  }
  assert.deepEqual(templateLayout({ savedActiveOrder: ['DATA_HAZARD'] }).savedActiveOrder, ['DATA_HAZARD']);
});
test('only implemented and verified effective residual ratings can resolve the initial 5x5 progression block', () => {
  assert.equal(riskProgressBlock([step], 0), null);
  for (const patch of [{ status: '' }, { status: 'planned' }, { completedOn: '' }, { verifiedBy: '' }, { verifiedOn: '' }, { effectiveness: 'ineffective' }, { residualFrequency: 0 }, { residualSeverity: '' }, { verifiedOn: '2026-10-15' }]) {
    assert.equal(riskProgressBlock([{ ...step, actionPlan: { ...plan, ...patch } }], 0).score, 20);
  }
  assert.equal(riskProgressBlock([{ ...step, actionPlan: { ...plan, residualFrequency: 5 } }], 0).score, 20);
  assert.equal(step.riskLevel, 20);
  assert.equal(isActionVerified({ ...plan, verifiedOn: '2026-02-31' }), false);
});
test('hazard, procedure, criteria or action changes invalidate past verification without losing the plan or initial history', () => {
  const changed = reconcileActionPlans([step], [{ ...step, risks: [{ factor: 'New hazard' }] }])[0];
  assert.equal(changed.actionPlan.additionalControls, plan.additionalControls);
  assert.equal(changed.actionPlan.owner, plan.owner);
  assert.equal(changed.actionPlan.verifiedBy, '');
  assert.equal(changed.actionPlan.residualFrequency, '');
  assert.equal(reconcileActionPlans([step], [{ ...step, actionPlan: { ...plan, verifiedBy: 'Updated' } }])[0].actionPlan.verifiedBy, 'Updated');
  assert.equal(updateActionPlan(plan, 'additionalControls', 'New measure').verifiedBy, '');
  assert.equal(reconcileProcedureAnalysis(step, { ...step.proc, stepDetail: 'New site' }, 0).actionPlan.status, '');
  assert.equal(changeAssessmentProfile([step], {}, { frequencyMax: 3 })[0].actionPlan.residualFrequency, '');
});
test('private save/reopen retains actuals, while publication, forks, reusable steps and new runs exclude them', () => {
  const snapshot = { publicationConsent: true, formData: { projectName: 'Inspection', jsaType: '2-step' }, analysisData: [step], layoutData: { savedActiveOrder: defaultColumns('2-step') } };
  const privateRow = projectPayload(snapshot, 'owner', false);
  assert.deepEqual(projectEditorState(privateRow, true).analysisData[0].actionPlan, plan);
  const publicRow = projectPayload(snapshot, 'owner', true);
  assert.deepEqual(publicRow.analysis_data[0].actionPlan, { additionalControls: plan.additionalControls });
  assert.deepEqual(projectEditorState(privateRow, false).analysisData[0].actionPlan, { additionalControls: plan.additionalControls });
  assert.deepEqual(reusableActionStep(step).actionPlan, { additionalControls: plan.additionalControls });
  const doc = importJsa(privateRow);
  assert.deepEqual(doc.analysisData[0].actionPlan, { additionalControls: plan.additionalControls });
  const record = { data: { documents: [{ ...doc, analysisData: [step] }] } };
  assert.deepEqual(startWork(record).documents[0].analysisData[0].actionPlan, { additionalControls: plan.additionalControls });
  assert.deepEqual(duplicatePackage(record, 'v2').data.documents[0].analysisData[0].actionPlan, { additionalControls: plan.additionalControls });
  assert.equal(record.data.documents[0].analysisData[0].actionPlan.verifiedBy, 'Verifier');
  const copied = duplicatePackage(record, 'v3'); copied.data.documents[0].analysisData[0].risks[0].factor = 'Changed';
  assert.equal(record.data.documents[0].analysisData[0].risks[0].factor, 'Moving part');
  assert.equal(actionPlan(null).status, '');
});
test('all supported locales render the new columns, actuals and residual status through the shared print renderer', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const previousDocument = global.document;
  try {
    const { default: i18n } = await server.ssrLoadModule('/src/i18n.js');
    global.document = { documentElement: {} }; await i18n.changeLanguage('en-US');
    const { default: Content } = await server.ssrLoadModule('/src/components/DocumentContent.jsx');
    for (const locale of SUPPORTED_LANGS) for (const type of ['2-step', '3-step']) {
      const ui = getActionPlanUi(locale);
      assert.ok(Object.values(ui).every(value => typeof value === 'string' && value.length > 0), locale);
      const layout = { documentBlocks: [{ id: 'JSA_TABLE', enabled: true }], savedActiveOrder: defaultColumns(type) };
      const html = renderToStaticMarkup(React.createElement(Content, { documentLocale: locale, formData: { jsaType: type }, layout, analysisData: [step] }));
      assert.ok(html.includes(ui.residualRisk), locale);
      assert.ok(html.includes('1 × 4 = 4'), locale);
      assert.ok(html.includes(ui.verified), locale);
      assert.ok(html.includes('Verifier'), locale);
      assert.ok(html.includes(type === '2-step' ? 'Install a fixed guard' : 'Guard'), locale);
      assert.ok(!html.includes('undefined'), locale);
    }
    const blank = renderToStaticMarkup(React.createElement(Content, { documentLocale: 'ko', formData: {}, layout: { documentBlocks: [{ id: 'JSA_TABLE', enabled: true }, { id: 'NOTES', enabled: true }], savedActiveOrder: defaultColumns('2-step') }, analysisData: [{ frequency: 0, severity: 0, riskLevel: 0, risks: [{ factor: '', measure: '' }] }] }));
    assert.ok(!blank.includes('•')); assert.ok(!blank.includes('>0</td>')); assert.ok(!blank.includes('—'));
  } finally { global.document = previousDocument; await server.close(); }
});
