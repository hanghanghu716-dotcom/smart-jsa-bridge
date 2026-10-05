import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { duplicatePackage, startWork } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';

const make = (country, kind, language = 'en') => createRegionalTemplate(kind, {
  jurisdiction: country, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language), highRiskConstruction: 'yes',
});
const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;

test('GB/US/JP general inspections retain editable standards but never carry old inspection decisions into fresh work', () => {
  for (const country of ['GB', 'US', 'JP']) for (const language of TASK_SAFETY_LANGUAGES) {
    const doc = make(country, 'inspection', language);
    assert.equal(doc.orientation, 'landscape');
    assert.equal(doc.regional.version, '2026-10-05.11');
    assert.equal(field(doc, 'inspectionScope').value, taskSafetyText(language, 'inspectionScope'));
    assert.doesNotMatch(field(doc, 'inspectionScope').value, /3 months|15th|annual certificate/);
    const table = doc.blocks.find(b => b.type === 'table');
    assert.equal(table.columns.length, 7);
    const item = table.columns.find(c => c.key === 'item');
    table.rows[0].values[item.id] = 'Reusable control to inspect';
    for (const column of table.columns.filter(c => c.kind !== 'text')) {
      column.mode = 'standard'; table.rows[0].values[column.id] = 'PREVIOUS_RESULT';
    }
    for (const key of ['inspectionPlan', 'inspectionLimits', 'inspectionReview', 'inspectionResponse']) {
      assert.equal(field(doc, key).kind, 'verification');
      field(doc, key).mode = 'standard'; field(doc, key).value = 'PREVIOUS_RESULT';
    }
    // Exercise legacy/un-normalised records, without going through the current save path.
    const record = { data: { context: doc.regional.context, documents: [doc] } };
    const original = structuredClone(record);
    for (const result of [startWork(record), duplicatePackage(record, 'Copied', 'ver.2').data]) {
      assert.doesNotMatch(JSON.stringify(result), /PREVIOUS_RESULT/);
      assert.match(JSON.stringify(result), /Reusable control to inspect/);
      assert.deepEqual(result.documents[0].regional.sources, doc.regional.sources);
    }
    assert.deepEqual(record, original);
  }
  for (const country of ['AU', 'CA', 'SG']) assert.equal(field(make(country, 'inspection'), 'inspectionScope'), undefined);
});

test('US briefing and Japanese procedure checks stay fresh and do not rewrite already saved versions', () => {
  for (const [country, kind, key] of [['US', 'toolbox_talk', 'briefingUnderstanding'], ['JP', 'method_statement', 'procedureChangeRecord']]) {
    for (const language of TASK_SAFETY_LANGUAGES) {
      const doc = make(country, kind, language);
      assert.equal(doc.regional.version, '2026-10-05.11');
      assert.equal(field(doc, key).value, ''); assert.equal(field(doc, key).mode, 'runtime');
      field(doc, key).mode = 'standard'; field(doc, key).value = 'PAST_CONFIRMATION';
      assert.doesNotMatch(JSON.stringify(startWork({ data: { documents: [doc] } })), /PAST_CONFIRMATION/);
      const saved = structuredClone(doc); saved.regional.version = 'saved-v1';
      saved.blocks = saved.blocks.filter(b => b.field?.key !== key);
      const run = startWork({ data: { context: saved.regional.context, documents: [saved] } });
      assert.equal(run.documents[0].regional.version, 'saved-v1');
      assert.equal(field(run.documents[0], key), undefined);
    }
  }
  assert.equal(field(make('GB', 'toolbox_talk'), 'briefingUnderstanding'), undefined);
  assert.equal(field(make('SG', 'method_statement'), 'procedureChangeRecord'), undefined);
});

test('scoped notices keep roles, evidence and conditional timing distinct across translations', () => {
  assert.match(taskSafetyText('ja', 'onCoordinationNotice'), /雇用主・安全代表/);
  assert.match(taskSafetyText('ru', 'onCoordinationNotice'), /работодателям/);
  for (const [language, plan, records] of [
    ['fr', /plan/, /permis et évaluations/], ['it', /piano/, /permessi e valutazioni/],
    ['es', /plan/, /permisos y evaluaciones/], ['pt', /plano/, /permissões e avaliações/],
    ['ru', /плану/, /разрешений и оценок/],
  ]) {
    assert.match(taskSafetyText(language, 'onEntryNotice'), plan);
    assert.match(taskSafetyText(language, 'auEntryNotice'), records);
  }
  assert.match(taskSafetyText('de', 'bcEntryNotice'), /genehmigen und unterschreiben/);
  for (const language of ['de', 'fr', 'it', 'es', 'pt']) assert.match(taskSafetyText(language, 'jpEntryNotice'), /作業主任者/);
  assert.match(taskSafetyText('en', 'brElectricalEditionNotice'), /2027-06-01/);
  assert.match(taskSafetyText('en', 'brElectricalEditionNotice'), /limited to 10\.6\.4\(e\)/);
  assert.match(taskSafetyText('en', 'brHeightTransitionNotice'), /no automatic exemption/);
  assert.match(taskSafetyText('en', 'ruExtensionNotice'), /subsequent-change review remains outstanding/);
});
