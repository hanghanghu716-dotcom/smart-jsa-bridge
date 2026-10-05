import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { COUNTRY_FORM_IDS, COUNTRY_FORM_SOURCES } from '../src/utils/regionalCountryFormSources20261005.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;
const make = (jurisdiction, kind, language = 'en') => createRegionalTemplate(kind, {
  jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
});

test('twelve country starter forms clear prior decisions while preserving reusable controls and independent copies', () => {
  assert.equal(COUNTRY_FORM_IDS.length, 12);
  for (const id of COUNTRY_FORM_IDS) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, kind] = id.split('.');
    const doc = make(country, kind, language);
    assert.equal(doc.regional.version, '2026-10-05.14');
    assert.equal(doc.regional.status, 'site-review-draft');
    assert.ok(COUNTRY_FORM_SOURCES[id].every(s => doc.regional.sources.some(r => r.url === s.url)));
    field(doc, 'scope').value = 'REUSABLE_WORK_CONTENT';
    for (const b of doc.blocks) {
      if (b.field?.kind === 'verification' || b.field?.kind === 'worker') {
        assert.equal(b.field.value, '');
        b.field.mode = 'standard'; b.field.value = 'OLD_SITE_DECISION';
      }
      for (const c of b.columns || []) if (c.mode !== 'standard') {
        if (['verification', 'worker', 'date', 'measurement', 'signature'].includes(c.kind)) c.mode = 'standard';
        for (const row of b.rows) row.values[c.id] = 'OLD_SITE_DECISION';
      }
    }
    const record = { data: { context: doc.regional.context, documents: [doc] } };
    const original = structuredClone(record);
    for (const result of [startWork(record), duplicatePackage(record, 'Independent copy', 'night').data]) {
      assert.doesNotMatch(JSON.stringify(result), /OLD_SITE_DECISION/);
      assert.match(JSON.stringify(result), /REUSABLE_WORK_CONTENT/);
      assert.deepEqual(result.documents[0].regional.sources, doc.regional.sources);
      result.documents[0].regional.sources[0].title = 'COPY_ONLY';
    }
    assert.deepEqual(record, original);
  }
});

test('provincial and German additions retain scope and do not rewrite older saved forms or permits', () => {
  for (const language of TASK_SAFETY_LANGUAGES) {
    const ab = make('CA-AB', 'risk_assessment', language);
    const bc = make('CA-BC', 'toolbox_talk', language);
    const de = make('DE', 'method_statement', language);
    assert.equal(field(ab, 'abAssessmentCycle').value, '');
    assert.equal(field(bc, 'bcMeetingBasis').value, '');
    assert.match(field(bc, 'bcMeetingBasis').label, /3\.1\/3\.2/);
    assert.equal(field(de, 'procedureScope').value, taskSafetyText(language, 'deProcedureScope'));
    for (const country of ['CA-AB', 'CA-BC', 'DE']) {
      const inspection = make(country, 'inspection', language);
      assert.equal(inspection.orientation, 'landscape');
      const columns = inspection.blocks.find(b => b.type === 'table').columns;
      assert.equal(columns.length, 7);
      assert.equal(columns.find(c => c.key === 'actionCloseout').mode, 'runtime');
      assert.equal(field(inspection, 'inspectionScope').value, taskSafetyText(language, 'inspectionScope'));
      const old = structuredClone(inspection);
      old.regional.version = 'old-personal-template';
      old.blocks = old.blocks.filter(b => !['frameworkBasis', 'inspectionResponse', 'bcInspectionParticipation'].includes(b.field?.key));
      const restored = startWork({ data: { documents: [old] } }).documents[0];
      assert.equal(restored.regional.version, 'old-personal-template');
      assert.equal(field(restored, 'frameworkBasis'), undefined);
      const permit = make(country, 'permit_to_work', language);
      assert.notEqual(permit.regional.version, '2026-10-05.14');
      assert.equal(field(permit, 'frameworkBasis').kind, 'verification');
    }
    assert.equal(field(make('CA-AB', 'toolbox_talk', language), 'bcMeetingBasis'), undefined);
    assert.equal(field(make('DE', 'inspection', language), 'bcInspectionParticipation'), undefined);
    assert.ok(field(make('CA-BC', 'inspection', language), 'bcInspectionParticipation'));
  }
  assert.match(taskSafetyText('en', 'bcMeetingBasis'), /monthly meetings for small operations covered by 3\.2/);
  assert.match(taskSafetyText('de', 'bcMeetingBasis'), /monatlich für kleine Betriebe nach 3\.2/);
  assert.match(taskSafetyText('ko', 'bcMeetingBasis'), /3\.2 적용 소규모/);
  assert.match(taskSafetyText('en', 'bcInspectionParticipation'), /where feasible/);
  assert.equal(field(make('CA-ON', 'inspection'), 'inspectionResponse').kind, 'verification');
  assert.equal(field(make('CA-ON', 'inspection'), 'bcInspectionParticipation'), undefined);
});
