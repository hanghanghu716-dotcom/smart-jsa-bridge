import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { regionalText } from '../src/locales/regionalWorkText.js';
import { cleanPackage, duplicatePackage, startWork } from '../src/utils/workPackages.js';
import { baseTerminologyText, terminologyHash } from './regional-terminology-fingerprint.js';

const additions = [
  ['CA-QC', 'confined', ['qcOxygenCause', 'trainingEvidence', 'rescueReadiness']],
  ['CA-QC', 'hot', ['qcFumeSources']],
  ['IT', 'height', ['itRoofStrength']], ['IT', 'electrical', ['itElectricalRoles']],
  ...['height', 'confined', 'electrical', 'hot'].map(t => ['SA', t, ['saPracticeValidity', 'trainingEvidence']]),
  ['BR', 'height', ['brLadderInventory']],
  ['RU', 'hot', ['ruCrewBriefing', 'ruFireClearance', 'dailyReview', 'permitRecord']],
];
const form = (jurisdiction, topic, documentLocale = 'en-US') => createRegionalTemplate('permit_to_work',
  { jurisdiction, documentLocale }, null, { taskTypes: [topic] });

test('batch checks reset actual values in 100 country/topic/language forms, with independent copies', () => {
  for (const [jurisdiction, topic, keys] of additions) for (const language of TASK_SAFETY_LANGUAGES) {
    const documentLocale = WORK_DOCUMENT_LANGUAGES.find(locale => locale.split('-')[0] === language);
    const context = { jurisdiction, documentLocale };
    const doc = form(jurisdiction, topic, documentLocale);
    const review = doc.regional.taskReviews[0];
    assert.equal(review.status, ['CA-QC.confined', 'IT.height', 'BR.height'].includes(jurisdiction + '.' + topic) ? 'scoped-source-review' : 'partial-source-review');
    const notice = doc.blocks.find(b => b.field?.key === `${topic}.notice`).field.value;
    for (const key of [review.requirements.noteKey, ...review.requirements.additionalNotes]) assert.ok(notice.includes(taskSafetyText(language, key)));
    for (const key of keys) {
      const field = doc.blocks.find(b => b.field?.key === `${topic}.${key}`).field;
      assert.equal(field.value, '');
      assert.equal(field.mode, 'runtime');
      assert.ok(field.label.includes(taskSafetyText(language, key)));
      // Historical/manual mode changes must not carry actual checks into a new run.
      field.mode = 'standard'; field.value = 'HISTORICAL_BATCH_CHECK';
    }
    const record = { id: 'batch', data: cleanPackage({ context, documents: [doc] }) };
    const historical = structuredClone(record);
    const run = startWork(record);
    assert.doesNotMatch(JSON.stringify(run), /HISTORICAL_BATCH_CHECK/);
    assert.deepEqual(run.documents[0].regional, record.data.documents[0].regional);
    duplicatePackage(record, 'Independent batch', 'ver.2').data.documents[0].regional.taskReviews[0].requirements.fields.push('changed');
    assert.deepEqual(record, historical);
  }
});

test('local obligations and role names do not leak into unrelated jurisdictions or use draft Italian roles', () => {
  const it = form('IT', 'electrical');
  assert.match(it.regional.taskReviews[0].terms, /GI \(Gestore Impianto\).*RLE \(Responsabile del Lavoro elettrico\).*LAV \(Lavoratore\)/);
  assert.doesNotMatch(it.regional.taskReviews[0].terms, /\bRL \(|\bL \(/);
  for (const [jurisdiction, topic, keys] of additions) {
    const localKeys = keys.filter(key => /^(qc|it|sa|br|ru)[A-Z]/.test(key));
    for (const key of localKeys) {
      assert.ok(form(jurisdiction, topic).blocks.some(b => b.field?.key === `${topic}.${key}`));
      assert.ok(!form('KR', topic).blocks.some(b => b.field?.key === `${topic}.${key}`));
    }
  }
  assert.match(taskSafetyText('en', 'qcEntryUpdate'), /19.5%.*18/);
  assert.match(taskSafetyText('en', 'qcOxygenCause'), /does not authorise entry/);
  assert.match(taskSafetyText('en', 'ruFireScopeNotice'), /at least 2 hours.*Sector rules may require longer/);
  assert.match(taskSafetyText('en', 'saPracticeNotice'), /distinct from site PTW/);
});

test('base terminology corrections preserve signatures, competency and approving responsibility', () => {
  assert.match(regionalText('de', 'Worker consultation, briefing and acknowledgement signatures'), /unterschriften/);
  assert.match(regionalText('ja', 'Roles, training and competency checks'), /力量/);
  assert.match(regionalText('fr', 'Contracting parties and coordination record'), /Donneur d’ordre/);
  assert.match(regionalText('it', 'Contracting parties and coordination record'), /Committente/);
  assert.doesNotMatch(regionalText('ar', 'Assessment team leader and approving manager'), /المدير المعتمد/);
  assert.match(regionalText('ar', 'Source likelihood / severity / risk'), /مستوى المخاطر/);
});

test('terminology closure hashes track inline Korean as well as dictionary translations', () => {
  const key = 'Roles, training and competency checks';
  const original = fs.readFileSync('src/utils/regionalWorkTemplates.js', 'utf8');
  const before = baseTerminologyText(key, [original]);
  const after = baseTerminologyText(key, [original.replace('역할·교육·역량·자격 확인', '교육만 확인')]);
  assert.ok(before.ko.includes('역할·교육·역량·자격 확인'));
  assert.notEqual(terminologyHash(before), terminologyHash(after));
  assert.equal(baseTerminologyText('People at risk'), null);
  assert.equal(baseTerminologyText('Applicant / site check / permit authority signatures'), null);
});
