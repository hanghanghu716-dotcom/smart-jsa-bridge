import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { FR_ES_FORM_IDS, FR_ES_FORM_SOURCES } from '../src/utils/regionalFrEsFormSources20261005.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';

const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;
const make = (jurisdiction, kind, language) => createRegionalTemplate(kind, {
  jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
});

test('FR/ES planning and site decisions reset in new runs and independent copies in every language', () => {
  assert.equal(FR_ES_FORM_IDS.length, 8);
  for (const id of FR_ES_FORM_IDS) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, kind] = id.split('.');
    const doc = make(country, kind, language);
    assert.equal(doc.regional.version, '2026-10-05.15');
    assert.equal(doc.regional.status, 'site-review-draft');
    assert.equal(field(doc, 'baseScope').value, taskSafetyText(language, country === 'FR' ? 'frTaskFormScope' : 'esTaskFormScope'));
    assert.ok(FR_ES_FORM_SOURCES[id].every(s => doc.regional.sources.some(r => r.url === s.url)));
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

test('FR/ES task forms retain organisational boundaries and do not migrate older versions or permits', () => {
  for (const language of TASK_SAFETY_LANGUAGES) for (const country of ['FR', 'ES']) {
    const assessment = make(country, 'risk_assessment', language);
    const inspection = make(country, 'inspection', language);
    for (const doc of [assessment, inspection]) {
      for (const key of ['preventionPlanLink', 'actionResources']) {
        assert.equal(field(doc, key).kind, 'verification');
        assert.equal(field(doc, key).mode, 'runtime');
        assert.equal(field(doc, key).value, '');
      }
    }
    assert.equal(inspection.orientation, 'landscape');
    assert.equal(inspection.blocks.find(b => b.type === 'table').columns.length, 7);
    assert.equal(field(make(country, 'toolbox_talk', language), 'briefingScope').value, taskSafetyText(language, 'briefingScope'));
    const procedure = make(country, 'method_statement', language);
    assert.match(field(procedure, 'contractorCoordination').label, country === 'FR' ? /Plan de prévention/ : /CAE/);
    assert.equal(field(procedure, 'procedureAccess').value, '');
    if (country === 'FR') assert.match(field(assessment, 'organisationRecord').label, /DUERP/);
    else assert.equal(field(assessment, 'competency').kind, 'verification');
    const older = structuredClone(inspection);
    older.regional.version = 'older-user-version';
    older.blocks = older.blocks.filter(b => !['preventionPlanLink', 'actionResources'].includes(b.field?.key));
    const restored = startWork({ data: { documents: [older] } }).documents[0];
    assert.equal(restored.regional.version, 'older-user-version');
    assert.equal(field(restored, 'actionResources'), undefined);
    const permit = make(country, 'permit_to_work', language);
    assert.notEqual(permit.regional.version, '2026-10-05.15');
    assert.equal(field(permit, 'preventionPlanLink'), undefined);
    assert.equal(field(permit, 'baseScope'), undefined);
    assert.equal(field(make('DE', 'inspection', language), 'preventionPlanLink'), undefined);
    assert.equal(field(make('GB', 'inspection', language), 'actionResources'), undefined);
  }
});
