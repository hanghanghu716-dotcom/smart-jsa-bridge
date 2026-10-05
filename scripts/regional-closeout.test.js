import test from 'node:test';
import assert from 'node:assert/strict';
import { CLOSEOUT_REVIEW, CLOSEOUT_VERSION } from '../src/utils/regionalCloseoutReview20261006.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
const make = (country, topic, language = 'en') => createRegionalTemplate('permit_to_work', {
  jurisdiction: country, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
}, null, { taskTypes: [topic] });
const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;

test('all seven closeout combinations preserve unresolved evidence and reset current checks in ten languages', () => {
  assert.equal(Object.keys(CLOSEOUT_REVIEW).length, 7);
  for (const [id, supplement] of Object.entries(CLOSEOUT_REVIEW)) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, topic] = id.split('.'), doc = make(country, topic, language), r = doc.regional.taskReviews[0];
    assert.equal(r.version, CLOSEOUT_VERSION);
    assert.equal(r.legalApplicability, 'site-and-sector-review-required');
    assert.equal(r.status, supplement.resolve ? 'scoped-source-review' : 'partial-source-review');
    assert.equal(field(doc, `${topic}.notice`).value.includes(taskSafetyText(language, 'pending')), !supplement.resolve);
    if (supplement.note) assert.ok(field(doc, `${topic}.notice`).value.includes(taskSafetyText(language, supplement.note)));
    if (supplement.blocker) assert.equal(r.requirements.reviewBlocker.required, supplement.blocker.required);
    for (const key of supplement.fields) {
      const f = field(doc, `${topic}.${key}`);
      assert.equal(f.value, ''); assert.equal(f.mode, 'runtime'); assert.equal(f.kind, 'verification');
      assert.ok(f.label.includes(taskSafetyText(language, key)));
      f.value = 'PREVIOUS_PERMIT_CONFIRMATION'; f.mode = 'standard';
    }
    for (const key of supplement.removeFields || []) assert.equal(field(doc, `${topic}.${key}`), undefined);
    const record = { data: { documents: [doc], context: doc.regional.context } }, original = structuredClone(record);
    for (const copy of [startWork(record), duplicatePackage(record, 'night', 'ver.2').data]) {
      assert.doesNotMatch(JSON.stringify(copy), /PREVIOUS_PERMIT_CONFIRMATION/);
      assert.deepEqual(copy.documents[0].regional.taskReviews, doc.regional.taskReviews);
      copy.documents[0].regional.taskReviews[0].requirements.remaining = 'COPY_ONLY';
    }
    assert.deepEqual(record, original);
  }
});

test('welding rules do not leak into electrical work and source access never implies review completion', () => {
  for (const language of TASK_SAFETY_LANGUAGES) {
    const sa = make('SA', 'electrical', language);
    assert.equal(field(sa, 'electrical.weldingEquipmentCheck'), undefined);
    assert.ok(field(sa, 'electrical.saElectricalEquipment'));
    assert.ok(field(make('SA', 'hot', language), 'hot.weldingEquipmentCheck'));
    for (const country of ['KR', 'IT', 'SA', 'CA-QC']) assert.equal(field(make(country, 'hot', language), 'hot.ruWeldingPermitCycle'), undefined);
  }
  const ru = make('RU', 'hot').regional.taskReviews[0];
  assert.ok(ru.requirements.sources.some(s => s.url.endsWith('/25450')));
  assert.ok(ru.requirements.sources.some(s => s.url.endsWith('/55545') && s.scope.includes('item 30')));
  assert.match(ru.requirements.remaining, /clause 8 exclusions/);
  for (const [id, r] of Object.entries(CLOSEOUT_REVIEW).filter(([, r]) => r.blocker)) {
    const [country, topic] = id.split('.'), actual = make(country, topic).regional.taskReviews[0];
    assert.equal(actual.status, 'partial-source-review');
    assert.ok(actual.requirements.reviewBlocker.accessUrl.startsWith('https://'));
    assert.ok(r.blocker.required.length > 60);
  }
});

test('opening old forms preserves their version and fields, including a legacy Saudi electrical draft', () => {
  const doc = make('SA', 'electrical');
  doc.regional.version = '2026-10-06.27';
  const f = field(doc, 'electrical.saElectricalEquipment');
  f.key = 'electrical.weldingEquipmentCheck'; f.label = 'OLD LABEL';
  delete doc.regional.taskReviews[0].requirements.reviewBlocker;
  const copy = startWork({ data: { documents: [doc] } }).documents[0];
  assert.equal(copy.regional.version, '2026-10-06.27');
  assert.equal(field(copy, 'electrical.weldingEquipmentCheck').label, 'OLD LABEL');
  assert.equal(field(copy, 'electrical.saElectricalEquipment'), undefined);
  assert.equal(copy.regional.taskReviews[0].requirements.reviewBlocker, undefined);
});
