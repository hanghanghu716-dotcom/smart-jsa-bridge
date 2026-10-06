import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { KR_ON_FORM_IDS, KR_ON_FORM_SOURCES } from '../src/utils/regionalKrOnFormSources20261005.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';

const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;
const make = (jurisdiction, kind, language) => createRegionalTemplate(kind, {
  jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
});

test('KR/ON planning and site decisions reset in new runs and independent copies in every language', () => {
  assert.equal(KR_ON_FORM_IDS.length, 9);
  for (const id of KR_ON_FORM_IDS) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, kind] = id.split('.');
    const doc = make(country, kind, language);
    assert.equal(doc.regional.version, '2026-10-05.17');
    assert.equal(doc.regional.status, 'site-review-draft');
    assert.equal(field(doc, 'baseScope').value, taskSafetyText(language, country === 'KR' ? 'krTaskFormScope' : 'onTaskFormScope'));
    assert.ok(KR_ON_FORM_SOURCES[id].every(s => doc.regional.sources.some(r => r.url === s.url)));
    assert.equal(new Set(doc.blocks.filter(b => b.field).map(b => b.field.key)).size, doc.blocks.filter(b => b.field).length);
    field(doc, 'scope').value = 'REUSABLE_TASK';
    for (const b of doc.blocks) {
      if (b.field && ['verification', 'worker'].includes(b.field.kind)) {
        b.field.mode = 'standard'; b.field.value = 'OLD_SITE_RESULT';
      }
      for (const c of b.columns || []) if (c.mode !== 'standard') {
        if (['verification', 'worker'].includes(c.kind)) c.mode = 'standard';
        for (const row of b.rows) row.values[c.id] = 'OLD_SITE_RESULT';
      }
    }
    const record = { data: { context: doc.regional.context, documents: [doc] } };
    const before = structuredClone(record);
    for (const result of [startWork(record), duplicatePackage(record, 'Version 2', 'night').data]) {
      assert.doesNotMatch(JSON.stringify(result), /OLD_SITE_RESULT/);
      assert.equal(field(result.documents[0], 'scope').value, 'REUSABLE_TASK');
      assert.deepEqual(result.documents[0].regional.sources, doc.regional.sources);
      result.documents[0].regional.sources[0].title = 'COPY_ONLY';
    }
    assert.deepEqual(record, before);
  }
});



test('KR/ON requirements stay conditional, country-specific and independent of saved versions', () => {
  for (const language of TASK_SAFETY_LANGUAGES) for (const country of ['KR', 'CA-ON']) {
    const assessment = make(country, 'risk_assessment', language);
    const inspection = make(country, 'inspection', language);
    const permit = make(country, 'permit_to_work', language);
    const talk = make(country, 'toolbox_talk', language);
    assert.equal(field(assessment, 'currentRiskDecision').kind, 'verification');
    assert.equal(field(assessment, 'recordCustodian').kind, 'worker');
    assert.equal(inspection.orientation, 'landscape');
    assert.equal(inspection.blocks.find(b => b.type === 'table').columns.length, 7);
    assert.equal(field(talk, 'briefingScope').value, taskSafetyText(language, 'briefingScope'));
    for (const key of ['competency', 'permitCoordination', 'permitAccessCheck', 'permitProcedure']) {
      assert.equal(field(permit, key).kind, 'verification');
      assert.equal(field(permit, key).mode, 'runtime');
      assert.equal(field(permit, key).value, '');
    }
    assert.equal(field(permit, 'permitScope').value, taskSafetyText(language, 'permitScope'));
    assert.equal(permit.regional.taskReviews, undefined);
    assert.ok(permit.blocks.findIndex(b => b.field?.key === 'permitAccessCheck') < permit.blocks.findIndex(b => b.field?.key === 'applicant'));
    if (country === 'KR') {
      for (const key of ['krWorkerParticipation', 'krAssessmentCycle']) assert.equal(field(assessment, key).kind, 'verification');
      assert.equal(field(talk, 'krTbmTransfer').kind, 'verification');
      assert.equal(field(inspection, 'onInspectionBasis'), undefined);
    } else {
      for (const key of ['onInspectionBasis', 'onRecommendationResponse']) assert.equal(field(inspection, key).kind, 'verification');
      assert.match(field(inspection, 'onRecommendationResponse').label, /21/);
      assert.equal(field(assessment, 'krAssessmentCycle'), undefined);
      assert.equal(field(talk, 'krTbmTransfer'), undefined);
      assert.equal(field(make(country, 'method_statement', language), 'procedureAccess').value, '');
    }
    const older = structuredClone(permit);
    older.regional.version = 'older-user-version';
    older.blocks = older.blocks.filter(b => b.field?.key !== 'permitAccessCheck');
    const restored = startWork({ data: { documents: [older] } }).documents[0];
    assert.equal(restored.regional.version, 'older-user-version');
    assert.equal(field(restored, 'permitAccessCheck'), undefined);
    for (const other of ['CA', 'CA-QC', 'CA-AB', 'CA-BC', 'JP']) {
      assert.equal(field(make(other, 'inspection', language), 'onRecommendationResponse'), undefined);
      assert.equal(field(make(other, 'risk_assessment', language), 'krAssessmentCycle'), undefined);
    }
  }
});
