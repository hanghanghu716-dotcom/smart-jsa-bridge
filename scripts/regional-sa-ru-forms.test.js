import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { SA_RU_FORM_IDS, SA_RU_FORM_SOURCES } from '../src/utils/regionalSaRuFormSources20261006.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';

const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;
const make = (jurisdiction, kind, language) => createRegionalTemplate(kind, {
  jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
});

test('SA/RU fields link live decisions and country-specific records without substituting approvals', () => {
  for (const country of ['SA', 'RU']) for (const language of TASK_SAFETY_LANGUAGES) {
    const risk = make(country, 'risk_assessment', language);
    for (const key of ['riskMethodChoice', 'currentRiskDecision', 'actionCloseout', 'preventionPlanLink', 'actionResources']) {
      assert.equal(field(risk, key).kind, 'verification');
      assert.equal(field(risk, key).mode, 'runtime');
    }
    const method = make(country, 'method_statement', language);
    for (const key of ['procedureChangeRecord', 'procedureAccess', 'competency']) assert.equal(field(method, key).kind, 'verification');
    const talk = make(country, 'toolbox_talk', language);
    assert.equal(field(talk, 'briefingScope').value, taskSafetyText(language, 'briefingScope'));
    assert.equal(field(talk, 'briefingFollowup').kind, 'verification');
    assert.equal(field(talk, 'briefingUnderstanding').kind, 'verification');
    const inspection = make(country, 'inspection', language);
    assert.equal(inspection.orientation, 'landscape');
    for (const key of ['inspectionPlan', 'inspectionLimits', 'inspectionReview', 'inspectionResponse', 'preventionPlanLink', 'actionResources']) assert.equal(field(inspection, key).kind, 'verification');
    const permit = make(country, 'permit_to_work', language);
    for (const key of ['frameworkBasis', 'competency', 'permitCoordination', 'permitLinkedRecords', 'permitRestartRecord', 'permitArchiveRecord']) assert.equal(field(permit, key).kind, 'verification');
    assert.equal(field(permit, 'permitRoleAssignments').kind, 'worker');
    assert.ok(permit.blocks.findIndex(b => b.field?.key === 'permitLinkedRecords') < permit.blocks.findIndex(b => b.field?.key === 'issue'));
    assert.equal((permit.regional.taskReviews || []).length, 0);
    if (country === 'SA') {
      assert.equal(field(permit, 'saPermitBasis').kind, 'verification');
      assert.equal(field(talk, 'saBriefingTransfer').kind, 'verification');
      assert.equal(field(talk, 'ruBriefingRecordLink'), undefined);
      assert.equal(field(method, 'ruInstructionStages'), undefined);
    } else {
      assert.equal(field(method, 'ruInstructionBasis').kind, 'verification');
      assert.equal(field(method, 'ruInstructionStages').label, taskSafetyText(language, 'ruInstructionStages'));
      assert.equal(field(method, 'safeCompletion').kind, 'verification');
      assert.equal(field(talk, 'ruBriefingRecordLink').kind, 'verification');
      assert.equal(field(permit, 'saPermitBasis'), undefined);
    }
    // Adding a specialist task keeps its separate review and does not duplicate generic fields.
    const specialised = createRegionalTemplate('permit_to_work', permit.regional.context, null, { taskTypes: ['confined'] });
    assert.equal(specialised.regional.taskReviews.length, 1);
    assert.ok(field(specialised, 'permitLinkedRecords'));
    assert.equal(new Set(specialised.blocks.filter(b => b.field).map(b => b.field.key)).size, specialised.blocks.filter(b => b.field).length);
    const saved = structuredClone(method);
    saved.regional.version = 'user-saved-version';
    saved.blocks = saved.blocks.filter(b => b.field?.key !== 'procedureAccess');
    const restored = startWork({ data: { documents: [saved] } }).documents[0];
    assert.equal(restored.regional.version, 'user-saved-version');
    assert.equal(field(restored, 'procedureAccess'), undefined);
  }
  for (const country of ['GB', 'SG', 'DE']) {
    assert.equal(field(make(country, 'method_statement', 'en'), 'ruInstructionStages'), undefined);
    assert.equal(field(make(country, 'permit_to_work', 'en'), 'saPermitBasis'), undefined);
  }
});

test('SA/RU references keep guidance, publication edition and record limits explicit', () => {
  for (const refs of Object.values(SA_RU_FORM_SOURCES)) for (const ref of refs) {
    assert.equal(ref.checkedAt, '2026-10-06');
    assert.ok(ref.scope.length > 100);
    assert.match(ref.url, /^https:\/\//);
  }
  assert.match(SA_RU_FORM_SOURCES['SA.risk_assessment'][0].scope, /Guidance expressly/);
  assert.match(SA_RU_FORM_SOURCES['RU.risk_assessment'][0].scope, /1–30/);
  assert.match(SA_RU_FORM_SOURCES['RU.method_statement'][0].scope, /not full original annex review/);
  assert.match(SA_RU_FORM_SOURCES['RU.permit_to_work'][0].scope, /Annex 5 is a clearance-radius table/);
  for (const language of TASK_SAFETY_LANGUAGES) {
    assert.match(taskSafetyText(language, 'ruTaskFormScope'), /СУОТ/);
    assert.match(taskSafetyText(language, 'ruTaskFormScope'), /СОУТ/);
    assert.match(taskSafetyText(language, 'ruTaskFormScope'), /наряд-допуск/);
  }
});

test('SA/RU form planning and site decisions reset in new runs and independent copies in every language', () => {
  assert.equal(SA_RU_FORM_IDS.length, 10);
  for (const id of SA_RU_FORM_IDS) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, kind] = id.split('.');
    const doc = make(country, kind, language);
    assert.equal(doc.regional.version, '2026-10-06.19');
    assert.equal(doc.regional.status, 'site-review-draft');
    assert.equal(field(doc, 'baseScope').value, taskSafetyText(language, country === 'SA' ? 'saTaskFormScope' : 'ruTaskFormScope'));
    assert.ok(SA_RU_FORM_SOURCES[id].every(s => doc.regional.sources.some(r => r.url === s.url)));
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



