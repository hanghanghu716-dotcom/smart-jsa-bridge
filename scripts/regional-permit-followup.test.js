import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { FOLLOWUP_PERMIT_IDS, FOLLOWUP_PERMIT_SOURCES } from '../src/utils/regionalPermitSources20261006.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';

const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;
const make = (jurisdiction, kind, language) => createRegionalTemplate(kind, {
  jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
});

test('Follow-up permit planning and site decisions reset in new runs and independent copies in every language', () => {
  assert.equal(FOLLOWUP_PERMIT_IDS.length, 10);
  for (const id of FOLLOWUP_PERMIT_IDS) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, kind] = id.split('.');
    const doc = make(country, kind, language);
    assert.equal(doc.regional.version, '2026-10-06.18');
    assert.equal(doc.regional.status, 'site-review-draft');
    assert.equal(field(doc, 'permitScope').value, taskSafetyText(language, 'permitScope'));
    assert.ok(FOLLOWUP_PERMIT_SOURCES[id].every(s => doc.regional.sources.some(r => r.url === s.url)));
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




test('Generic permits coordinate records without automatically creating specialist approvals', () => {
  for (const id of FOLLOWUP_PERMIT_IDS) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, kind] = id.split('.');
    const doc = make(country, kind, language);
    for (const key of ['frameworkBasis', 'competency', 'permitCoordination', 'permitLinkedRecords', 'permitRestartRecord', 'permitArchiveRecord']) {
      assert.equal(field(doc, key).kind, 'verification');
      assert.equal(field(doc, key).mode, 'runtime');
      assert.equal(field(doc, key).value, '');
    }
    assert.equal(field(doc, 'permitRoleAssignments').kind, 'worker');
    assert.equal(field(doc, 'permitRoleAssignments').mode, 'runtime');
    assert.equal(field(doc, 'permitAccessCheck'), undefined); // Ontario pre-shift wording is not a universal rule.
    assert.equal((doc.regional.taskReviews || []).length, 0);
    assert.ok(doc.blocks.findIndex(b => b.field?.key === 'permitLinkedRecords') < doc.blocks.findIndex(b => b.field?.key === 'issue'));
    assert.ok(doc.blocks.findIndex(b => b.field?.key === 'permitRestartRecord') < doc.blocks.findIndex(b => b.field?.key === 'handover'));
    const old = structuredClone(doc);
    old.regional.version = 'saved-original';
    old.blocks = old.blocks.filter(b => b.field?.key !== 'permitLinkedRecords');
    const restored = startWork({ data: { documents: [old] } }).documents[0];
    assert.equal(restored.regional.version, 'saved-original');
    assert.equal(field(restored, 'permitLinkedRecords'), undefined);
    // Adding a task retains both its checks and the generic record, without duplicate field keys.
    const specialised = createRegionalTemplate(kind, doc.regional.context, null, { taskTypes: ['confined'] });
    assert.equal(specialised.regional.taskReviews.length, 1);
    assert.ok(specialised.blocks.some(b => b.field?.key.startsWith('confined.')));
    assert.equal(new Set(specialised.blocks.filter(b => b.field).map(b => b.field.key)).size, specialised.blocks.filter(b => b.field).length);
    assert.ok(field(specialised, 'permitLinkedRecords'));
    assert.ok(FOLLOWUP_PERMIT_SOURCES[id].every(s => specialised.regional.sources.some(r => r.url === s.url)));
    const nativeScope = { DE: 'dePermitScope', JP: 'jpPermitScope', FR: 'frPermitScope', BR: 'brPermitScope' }[country];
    if (nativeScope) assert.equal(field(doc, 'permitRegionalScope').value, taskSafetyText(language, nativeScope));
    if (country.startsWith('CA-')) assert.equal(field(doc, 'permitRegionalScope').value, taskSafetyText(language, 'caScope'));
    for (const otherKind of ['risk_assessment', 'inspection', 'toolbox_talk']) assert.equal(field(make(country, otherKind, language), 'permitLinkedRecords'), undefined);
  }
  for (const country of ['KR', 'GB', 'US', 'AU', 'SG', 'CA-ON']) assert.equal(field(make(country, 'permit_to_work', 'en'), 'permitLinkedRecords'), undefined);
});

test('Permit sources retain their jurisdiction and guidance limits', () => {
  for (const sources of Object.values(FOLLOWUP_PERMIT_SOURCES)) for (const ref of sources) {
    assert.equal(ref.checkedAt, '2026-10-06');
    assert.ok(ref.scope.length > 80);
    assert.match(ref.url, /^https:\/\//);
  }
  assert.match(FOLLOWUP_PERMIT_SOURCES['CA.permit_to_work'][0].scope, /not a nationwide/i);
  assert.match(FOLLOWUP_PERMIT_SOURCES['CA-BC.permit_to_work'][0].scope, /conditional.*crew\/shift\/supervisor/);
  assert.match(FOLLOWUP_PERMIT_SOURCES['JP.permit_to_work'][0].scope, /Steel non-routine/);
  assert.match(FOLLOWUP_PERMIT_SOURCES['IT.permit_to_work'][0].scope, /Historical/);
  assert.match(FOLLOWUP_PERMIT_SOURCES['ES.permit_to_work'][0].scope, /Good-practice/);
  assert.equal(FOLLOWUP_PERMIT_SOURCES['BR.permit_to_work'][0].basis, 'regulation');
  for (const language of TASK_SAFETY_LANGUAGES) {
    assert.match(taskSafetyText(language, 'frPermitScope'), /plan de prévention/);
    assert.match(taskSafetyText(language, 'brPermitScope'), /NR-33/);
    assert.match(taskSafetyText(language, 'jpPermitScope'), /1997/);
    assert.match(taskSafetyText(language, 'dePermitScope'), /113-004/);
  }
});
