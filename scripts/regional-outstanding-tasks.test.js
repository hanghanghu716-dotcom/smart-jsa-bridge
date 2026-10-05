import { RU_ELECTRICAL_VERSION } from '../src/utils/regionalRuElectricalReview20261006.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { OUTSTANDING_TASK_REVIEW, OUTSTANDING_TASK_VERSION } from '../src/utils/regionalOutstandingTaskReview20261006.js';
import { OUTSTANDING_TASK_ROWS } from '../src/locales/regionalOutstandingTaskText20261006.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;
const make = (country, topic, language) => createRegionalTemplate('permit_to_work', {
  jurisdiction: country, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
}, null, { taskTypes: [topic] });

test('remaining ten combinations preserve scoped status and translated blank checks across ten languages', () => {
  assert.equal(Object.keys(OUTSTANDING_TASK_REVIEW).length, 10);
  assert.equal(OUTSTANDING_TASK_ROWS.trim().split('\n').length, 14);
  for (const [id, review] of Object.entries(OUTSTANDING_TASK_REVIEW)) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, topic] = id.split('.'), doc = make(country, topic, language), r = doc.regional.taskReviews[0];
    assert.equal(r.status, (id === 'RU.electrical' || review.resolve) ? 'scoped-source-review' : 'partial-source-review');
    assert.equal(r.legalApplicability, 'site-and-sector-review-required');
    assert.equal(r.version, id === 'RU.electrical' ? RU_ELECTRICAL_VERSION : OUTSTANDING_TASK_VERSION);
    assert.equal(field(doc, `${topic}.notice`).value.includes(taskSafetyText(language, 'pending')), !(id === 'RU.electrical' || review.resolve));
    for (const key of review.removeNotes || []) assert.ok(!field(doc, `${topic}.notice`).value.includes(taskSafetyText(language, key)));
    if (review.replaceNote) assert.ok(field(doc, `${topic}.notice`).value.includes(taskSafetyText(language, review.replaceNote)));
    for (const key of review.fields) {
      const f = field(doc, `${topic}.${key}`);
      assert.equal(f.value, ''); assert.equal(f.mode, 'runtime'); assert.equal(f.kind, 'verification');
      assert.ok(f.label.includes(taskSafetyText(language, key)));
      f.value = 'PRIOR_SITE_VALUE'; f.mode = 'standard';
    }
    const record = { data: { context: doc.regional.context, documents: [doc] } }, original = structuredClone(record);
    for (const copy of [startWork(record), duplicatePackage(record, 'night', 'v2').data]) {
      assert.doesNotMatch(JSON.stringify(copy), /PRIOR_SITE_VALUE/);
      assert.deepEqual(copy.documents[0].regional.taskReviews, doc.regional.taskReviews);
      copy.documents[0].regional.taskReviews[0].sources[0].title = 'COPY_ONLY';
    }
    assert.deepEqual(record, original);
  }
});

test('new jurisdiction-specific checks do not leak into other countries or invent approved values', () => {
  for (const [owner, topic, key] of [['RU', 'height', 'ruHeightCycle'], ['RU', 'confined', 'ruEntryPurpose'], ['RU', 'electrical', 'ruAdmittingCheck'], ['IT', 'electrical', 'itElectricalHandover'], ['CA-QC', 'hot', 'qcWatchStages'], ['SA', 'hot', 'saPrivateConfirmation']]) {
    for (const country of ['RU', 'IT', 'CA-QC', 'SA', 'KR', 'FR']) for (const language of TASK_SAFETY_LANGUAGES) {
      assert.equal(!!field(make(country, topic, language), `${topic}.${key}`), country === owner);
    }
  }
  for (const language of TASK_SAFETY_LANGUAGES) assert.match(field(make('RU', 'electrical', language), 'electrical.roles').label, /допускающий/);
  assert.match(taskSafetyText('en', 'ruEntryReviewedNote'), /assessment entry is not work permission/);
  assert.match(taskSafetyText('en', 'saPrivateConfirmation'), /no diagnoses, test values or medical reports/);
});

test('old saved Russian drafts are not silently upgraded by opening or copying', () => {
  const doc = make('RU', 'confined', 'ru');
  doc.regional.version = '2026-10-06.25';
  doc.regional.taskReviews[0].status = 'partial-source-review';
  doc.blocks = doc.blocks.filter(b => b.field?.key !== 'confined.ruEntryCycle');
  const copy = startWork({ data: { documents: [doc] } }).documents[0];
  assert.equal(copy.regional.version, '2026-10-06.25');
  assert.equal(copy.regional.taskReviews[0].status, 'partial-source-review');
  assert.equal(field(copy, 'confined.ruEntryCycle'), undefined);
});
