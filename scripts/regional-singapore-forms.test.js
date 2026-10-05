import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { cleanPackage, duplicatePackage, startWork } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';

const make = (kind, language = 'en', source = null, jurisdiction = 'SG') => createRegionalTemplate(kind, {
  jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
}, source);
const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;

test('Singapore fresh before/after ratings never inherit imported scores or previous findings', () => {
  const source = { title: 'Existing assessment', analysisData: [{
    proc: { stepTitle: 'Isolation' }, frequency: 2, severity: 3, riskLevel: 6,
    risks: [{ factor: 'Pressure', current_measure: 'Isolate', recommend_measure: 'Verify' }],
  }] };
  for (const language of TASK_SAFETY_LANGUAGES) {
    const doc = make('risk_assessment', language, source);
    const tables = doc.blocks.filter(b => b.type === 'table');
    const original = tables.find(b => b.columns.some(c => c.key === 'sourceRisk'));
    assert.equal(original.rows[0].values[original.columns.find(c => c.key === 'sourceRisk').id], '2 / 3 / 6');
    const current = tables.find(b => b.columns.some(c => c.key === 'sgInitialRisk'));
    assert.equal(current.rows[0].values[current.columns.find(c => c.key === 'hazard').id], 'Pressure');
    for (const key of ['sgInitialRisk', 'sgResidualRisk']) {
      const column = current.columns.find(c => c.key === key);
      assert.equal(column.mode, 'runtime'); assert.equal(column.kind, 'verification');
      assert.equal(current.rows[0].values[column.id], undefined);
      column.mode = 'standard'; current.rows[0].values[column.id] = 'OLD_RATING';
    }
    assert.ok(tables.every(b => b.columns.length <= 7));
    assert.equal(field(doc, 'sgApprovalRecord').mode, 'blank');
    assert.equal(field(doc, 'sgApprovalRecord').kind, 'worker');
    for (const key of ['sgAssessmentRegister', 'actionCloseout', 'sgApprovalRecord']) {
      const f = field(doc, key); assert.equal(f.value, '');
      f.mode = 'standard'; f.value = 'OLD_APPROVAL';
    }
    const record = { data: cleanPackage({ context: doc.regional.context, documents: [doc] }) };
    for (const result of [startWork(record), duplicatePackage(record, 'Copy', 'Night work').data]) {
      assert.doesNotMatch(JSON.stringify(result), /OLD_RATING|OLD_APPROVAL/);
      assert.match(JSON.stringify(result), /2 \/ 3 \/ 6/);
    }
  }
});

test('Singapore SWP, briefing and inspections connect review and follow-up without foreign duties', () => {
  for (const language of TASK_SAFETY_LANGUAGES) {
    assert.equal(field(make('method_statement', language), 'sgProcedureReview').mode, 'runtime');
    const talk = make('toolbox_talk', language);
    for (const key of ['sgBriefingReadiness', 'sgBriefingUnderstanding', 'briefingFollowup']) {
      assert.equal(field(talk, key).kind, 'verification');
      assert.equal(field(talk, key).value, '');
    }
    assert.doesNotMatch(JSON.stringify(talk), /37°C|37 °C|6 steps|six steps/);
    const inspection = make('inspection', language);
    assert.equal(inspection.orientation, 'landscape');
    for (const key of ['inspectionPlan', 'inspectionLimits', 'inspectionReview']) assert.equal(field(inspection, key).mode, 'runtime');
    const columns = inspection.blocks.find(b => b.type === 'table').columns;
    assert.equal(columns.length, 7);
    assert.equal(columns.find(c => c.key === 'actionCloseout').mode, 'runtime');
    for (const kind of ['risk_assessment', 'method_statement', 'toolbox_talk', 'inspection']) {
      assert.equal(make(kind, language).regional.version, '2026-10-05.9');
      assert.doesNotMatch(JSON.stringify(make(kind, language, null, 'GB')), /sgAssessmentRegister|sgInitialRisk|sgResidualRisk|sgApprovalRecord|sgProcedureReview|sgBriefingReadiness|sgBriefingUnderstanding/);
    }
  }
  // New starter versions do not mutate a saved user's field layout or identity.
  const saved = make('risk_assessment'); saved.regional.version = '2026-10-05.8';
  saved.blocks = saved.blocks.filter(b => b.field?.key !== 'sgApprovalRecord');
  const before = structuredClone(saved);
  const run = startWork({ data: { context: saved.regional.context, documents: [saved] } });
  assert.equal(run.documents[0].regional.version, '2026-10-05.8');
  assert.equal(field(run.documents[0], 'sgApprovalRecord'), undefined);
  assert.deepEqual(saved, before);
});

test('electrical translations retain the verifier, reverse supply and lock-removal authority', () => {
  for (const [language, verifier, backfeed] of [
    ['fr', /personne/, /réalimentation/], ['it', /persona/, /ritorni di alimentazione/],
    ['es', /persona/, /realimentación/], ['pt', /responsável/, /retroalimentação/],
  ]) {
    assert.match(taskSafetyText(language, 'isolationVerification'), verifier);
    assert.match(taskSafetyText(language, 'isolationVerification'), backfeed);
  }
  for (const [language, authority, basis] of [
    ['fr', /personne habilitée/, /fondement/], ['it', /persona autorizzata/, /motivi/],
    ['es', /persona autorizada/, /fundamento/], ['pt', /pessoa autorizada/, /fundamento/],
    ['ru', /лицо с правом/, /основания/],
  ]) {
    assert.match(taskSafetyText(language, 'restorationRelease'), authority);
    assert.match(taskSafetyText(language, 'restorationRelease'), basis);
  }
  assert.match(taskSafetyText('ja', 'jpIsolationChoice'), /施錠又は通電禁止表示又は監視人/);
  assert.match(taskSafetyText('en', 'krElectricalDetail'), /locks AND tags/);
  assert.match(taskSafetyText('en', 'jpElectricalDetail'), /not the operations-chief/);
});
