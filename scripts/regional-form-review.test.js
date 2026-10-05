import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { REGIONAL_FORM_SOURCES } from '../src/utils/regionalFormSources20261005.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { cleanPackage, duplicatePackage, startWork } from '../src/utils/workPackages.js';
import { canonicalForm, formFingerprint } from './regional-form-fingerprint.js';
import { terminologyHash } from './regional-terminology-fingerprint.js';

const locale = language => WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language);
const create = (id, language = 'en', options) => {
  const [jurisdiction, kind] = id.split('.');
  return createRegionalTemplate(kind, { jurisdiction, documentLocale: locale(language), highRiskConstruction: 'yes' }, null, options);
};
const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;

test('Reviewed forms in all ten languages reset actual findings, retain editable standards and preserve independent snapshots', () => {
  for (const id of Object.keys(REGIONAL_FORM_SOURCES)) for (const language of TASK_SAFETY_LANGUAGES) {
    const doc = create(id, language);
    field(doc, 'scope').value = 'REUSABLE_WORK_SCOPE';
    for (const block of doc.blocks) {
      if (block.field && block.field.kind !== 'text') {
        assert.equal(block.field.value, '');
        block.field.mode = 'standard'; block.field.value = 'OLD_ACTUAL_RESULT';
      }
      for (const column of block.columns || []) if (column.kind !== 'text') {
        column.mode = 'standard'; column.value = 'OLD_ACTUAL_RESULT';
        for (const row of block.rows) row.values[column.id] = 'OLD_ACTUAL_RESULT';
      }
    }
    const record = { id: 'record', data: cleanPackage({ context: doc.regional.context, documents: [doc] }) };
    const previous = structuredClone(record);
    const run = startWork(record);
    assert.doesNotMatch(JSON.stringify(run), /OLD_ACTUAL_RESULT/, id);
    assert.equal(field(run.documents[0], 'scope').value, 'REUSABLE_WORK_SCOPE');
    assert.deepEqual(run.documents[0].regional.sources, doc.regional.sources);
    const copy = duplicatePackage(record, 'Independent version', 'ver.2');
    copy.data.documents[0].blocks[0].field.value = 'CHANGED';
    copy.data.documents[0].regional.sources[0].scope = 'CHANGED';
    assert.deepEqual(record, previous);
    const old = structuredClone(record);
    old.data.documents[0].regional.version = 'saved-older-version';
    old.data.documents[0].blocks = old.data.documents[0].blocks.filter(b => b.field?.key !== 'baseScope');
    assert.equal(startWork(old).documents[0].regional.version, 'saved-older-version');
    assert.equal(field(startWork(old).documents[0], 'baseScope'), undefined);
  }
});

test('Ontario and Saudi scope labels exclude Québec codes in every language while Québec retains them', () => {
  for (const language of TASK_SAFETY_LANGUAGES) {
    for (const [jurisdiction, topic] of [['CA-ON', 'height'], ['CA-ON', 'electrical'], ['CA-ON', 'hot'], ['SA', 'confined']]) {
      const doc = create(`${jurisdiction}.permit_to_work`, language, { taskTypes: [topic] });
      assert.doesNotMatch(JSON.stringify(doc), /RSST|CSTC/);
      assert.ok(field(doc, `${topic}.applicableFramework`).label.includes(taskSafetyText(language, 'frameworkBasis')));
      if (jurisdiction === 'SA') assert.equal(doc.regional.taskReviews[0].status, 'partial-source-review');
    }
    for (const topic of ['height', 'confined', 'electrical', 'hot']) {
      assert.match(field(create('CA-QC.permit_to_work', language, { taskTypes: [topic] }), `${topic}.applicableFramework`).label, /RSST\/CSTC/);
    }
  }
});

test('reviewed field sets distinguish country, document purpose and actual versus stored values', () => {
  assert.ok(field(create('GB.method_statement'), 'contractorCoordination'));
  assert.doesNotMatch(field(create('GB.method_statement'), 'contractorCoordination').label, /PCBU|DUVRI/);
  const permit = create('GB.permit_to_work');
  assert.ok(permit.blocks.findIndex(b => b.field?.key === 'permitCoordination') < permit.blocks.findIndex(b => b.field?.key === 'issue'));
  assert.ok(field(permit, 'competency'));
  assert.equal(field(create('KR.permit_to_work'), 'permitCoordination'), undefined);
  assert.ok(field(create('US.risk_assessment'), 'hazardScenario'));
  assert.equal(field(create('KR.risk_assessment'), 'hazardScenario'), undefined);
  const inspection = create('CA.inspection');
  assert.equal(inspection.orientation, 'landscape');
  const table = inspection.blocks.find(b => b.type === 'table');
  assert.equal(table.columns.length, 7);
  for (const key of ['inspectionLocation', 'inspectionPriority', 'actionCloseout']) {
    const c = table.columns.find(c => c.key === key);
    assert.equal(c.kind, 'verification'); assert.equal(c.mode, 'runtime');
    assert.ok(table.rows.every(row => row.values[c.id] === undefined));
  }
  assert.equal(field(create('CA-ON.inspection'), 'inspectionPlan'), undefined);
  for (const country of ['GB', 'CA']) {
    const doc = create(`${country}.toolbox_talk`);
    assert.match(field(doc, 'briefingScope').value, /does not replace/);
    assert.equal(field(doc, 'briefingFollowup').mode, 'runtime');
  }
});

test('form fingerprints ignore random IDs but catch label, mode, layout and evidence changes', () => {
  assert.equal(formFingerprint('form:CA.inspection'), formFingerprint('form:CA.inspection'));
  const doc = create('CA.inspection');
  const initial = terminologyHash(canonicalForm(doc));
  for (const change of [
    d => { field(d, 'inspectionPlan').mode = 'standard'; },
    d => { d.blocks.find(b => b.type === 'table').columns.pop(); },
    d => { d.orientation = 'portrait'; },
    d => { d.regional.sources[0].scope = 'Unverified new scope'; },
    d => { field(d, 'inspectionPlan').label = 'Changed'; },
  ]) {
    const modified = structuredClone(doc); change(modified);
    assert.notEqual(terminologyHash(canonicalForm(modified)), initial);
  }
});

test('specialist labels preserve local roles, dated evidence and non-emergency routine classification', () => {
  assert.match(taskSafetyText('fr', 'employerCoordination'), /lead employer.*constructor/);
  assert.match(taskSafetyText('ar', 'employerCoordination'), /lead employer.*constructor/);
  assert.match(taskSafetyText('en', 'transitionEvidence'), /dates/);
  assert.match(taskSafetyText('fr', 'transitionEvidence'), /dates/);
  assert.match(taskSafetyText('de', 'stateCodeBasis'), /Bundesstaat/);
  assert.match(taskSafetyText('fr', 'rescueReadiness'), /registre/);
  assert.match(taskSafetyText('es', 'rescueReadiness'), /registro/);
  assert.match(taskSafetyText('ru', 'rescueReadiness'), /запись/);
  assert.match(taskSafetyText('fr', 'voltageRole'), /mise hors tension/);
  assert.doesNotMatch(taskSafetyText('ru', 'routineClassification'), /нештатная/);
  assert.match(taskSafetyText('ru', 'routineClassification'), /нерутинная/);
});
