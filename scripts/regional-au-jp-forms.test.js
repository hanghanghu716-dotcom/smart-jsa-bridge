import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate, regionalTemplates } from '../src/utils/regionalWorkTemplates.js';
import { cleanPackage, duplicatePackage, startWork } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';

const make = (jurisdiction, kind, language = 'en', source = null) => createRegionalTemplate(kind, {
  jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language), highRiskConstruction: 'yes',
}, source);
const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;

test('Australian SWMS stays conditional, distinguishes local duty holders and records safe restart and access', () => {
  for (const highRiskConstruction of ['', 'no', 'unknown']) {
    const context = { jurisdiction: 'AU', documentLocale: 'en-AU', highRiskConstruction };
    assert.equal(regionalTemplates(context).find(t => t.kind === 'method_statement').available, false);
    assert.throws(() => createRegionalTemplate('method_statement', context), /WORK_TEMPLATE_UNAVAILABLE/);
  }
  for (const language of TASK_SAFETY_LANGUAGES) {
    const doc = make('AU', 'method_statement', language);
    assert.equal(field(doc, 'baseScope').value, taskSafetyText(language, 'auJurisdictionNotice'));
    assert.equal(field(doc, 'contractorCoordination'), undefined);
    for (const key of ['frameworkBasis', 'auDutyHolders', 'auSwmsLifecycle', 'auSwmsRecord']) {
      assert.equal(field(doc, key).mode, 'runtime');
      assert.equal(field(doc, key).kind, 'verification');
      assert.equal(field(doc, key).value, '');
    }
    assert.ok(doc.regional.sources.some(s => s.url.includes('worksafe.vic.gov.au') && s.scope.includes('self-employed')));
    assert.equal(doc.regional.version, '2026-10-05.10');
    assert.doesNotMatch(JSON.stringify(doc.blocks), /250,?000|2 years|24 hours/);
    assert.equal(field(make('GB', 'method_statement', language), 'auDutyHolders'), undefined);
    assert.equal(field(make('AU', 'toolbox_talk', language), 'briefingFollowup').kind, 'verification');
    const inspection = make('AU', 'inspection', language);
    assert.equal(inspection.orientation, 'landscape');
    assert.equal(inspection.blocks.find(b => b.type === 'table').columns.length, 7);
    for (const key of ['inspectionPlan', 'inspectionLimits', 'inspectionReview']) assert.equal(field(inspection, key).value, '');
  }
});

test('Australian and Japanese current risk decisions remain fresh and separate from imported scores', () => {
  const source = { title: 'Previous work', analysisData: [{ proc: { stepTitle: 'Isolation' }, frequency: 2, severity: 3, riskLevel: 6,
    risks: [{ factor: 'Stored pressure', current_measure: 'Isolate', recommend_measure: 'Verify zero energy' }] }] };
  for (const country of ['AU', 'JP']) for (const language of TASK_SAFETY_LANGUAGES) {
    const doc = make(country, 'risk_assessment', language, source);
    const decision = field(doc, 'currentRiskDecision');
    assert.equal(decision.value, ''); assert.equal(decision.mode, 'runtime'); assert.equal(decision.kind, 'verification');
    const table = doc.blocks.find(b => b.type === 'table');
    assert.equal(table.rows[0].values[table.columns.find(c => c.key === 'sourceRisk').id], '2 / 3 / 6');
    for (const key of ['currentRiskDecision', 'actionCloseout']) {
      field(doc, key).mode = 'standard'; field(doc, key).value = 'OLD_SITE_APPROVAL';
    }
    const record = { data: cleanPackage({ context: doc.regional.context, documents: [doc] }) };
    const before = structuredClone(record);
    for (const result of [startWork(record), duplicatePackage(record, 'Independent', 'Night shift').data]) {
      assert.doesNotMatch(JSON.stringify(result), /OLD_SITE_APPROVAL/);
      assert.match(JSON.stringify(result), /2 \/ 3 \/ 6/);
      assert.match(JSON.stringify(result), /Stored pressure/);
    }
    assert.deepEqual(record, before);
  }
});

test('Japanese KY has its own action record and a real KY source, without replacing risk assessment', () => {
  for (const language of TASK_SAFETY_LANGUAGES) {
    const doc = make('JP', 'toolbox_talk', language);
    assert.equal(field(doc, 'briefingScope').value, taskSafetyText(language, 'jpKyScope'));
    for (const key of ['jpKyAction', 'briefingFollowup']) {
      assert.equal(field(doc, key).kind, 'verification');
      field(doc, key).mode = 'standard'; field(doc, key).value = 'OLD_KY_RESULT';
    }
    const record = { data: cleanPackage({ context: doc.regional.context, documents: [doc] }) };
    assert.doesNotMatch(JSON.stringify(startWork(record)), /OLD_KY_RESULT/);
    assert.ok(doc.regional.sources.some(s => s.url.endsWith('080201c_0014.pdf')));
    const oldReference = doc.regional.sources.find(s => s.url.endsWith('001413029.pdf'));
    assert.match(oldReference.title, /記録と見直し/);
    assert.doesNotMatch(oldReference.title, /KY/);
    assert.equal(field(make('KR', 'toolbox_talk', language), 'jpKyAction'), undefined);
  }
  assert.match(taskSafetyText('it', 'auHotDetail'), /approvazione dei lavori a caldo/);
  assert.match(taskSafetyText('it', 'onEnergyDetail'), /isolamento delle energie/);
  assert.match(taskSafetyText('fr', 'occupationPermitBasis'), /autorité émettrice/);
  assert.doesNotMatch(taskSafetyText('en', 'saOccupationDetail'), /Publication/);
});
