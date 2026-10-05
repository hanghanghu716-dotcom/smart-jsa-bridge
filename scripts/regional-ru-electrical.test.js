import test from 'node:test';
import assert from 'node:assert/strict';
import { RU_ELECTRICAL_FIELDS, RU_ELECTRICAL_VERSION } from '../src/utils/regionalRuElectricalReview20261006.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
const make = (country, language = 'ru') => createRegionalTemplate('permit_to_work', {
  jurisdiction: country, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
}, null, { taskTypes: ['electrical'] });
const field = (doc, key) => doc.blocks.find(b => b.field?.key === `electrical.${key}`)?.field;

test('Russian electrical admission and return checks stay blank, local and independent in ten languages', () => {
  for (const language of TASK_SAFETY_LANGUAGES) {
    const doc = make('RU', language), review = doc.regional.taskReviews[0];
    assert.equal(review.version, RU_ELECTRICAL_VERSION);
    assert.equal(review.status, 'scoped-source-review');
    assert.equal(review.legalApplicability, 'site-and-sector-review-required');
    assert.ok(field(doc, 'notice').value.includes(taskSafetyText(language, 'ruElectricalReviewedNote')));
    assert.ok(!field(doc, 'notice').value.includes(taskSafetyText(language, 'pending')));
    for (const key of RU_ELECTRICAL_FIELDS) {
      const f = field(doc, key);
      assert.equal(f.mode, 'runtime'); assert.equal(f.kind, 'verification'); assert.equal(f.value, '');
      assert.ok(f.label.includes(taskSafetyText(language, key)));
      f.value = 'OLD_SWITCHING_CONFIRMATION'; f.mode = 'standard';
    }
    const record = { data: { context: doc.regional.context, documents: [doc] } }, before = structuredClone(record);
    for (const copy of [startWork(record), duplicatePackage(record, 'night', 'v2').data]) {
      assert.doesNotMatch(JSON.stringify(copy), /OLD_SWITCHING_CONFIRMATION/);
      assert.deepEqual(copy.documents[0].regional.taskReviews, doc.regional.taskReviews);
      copy.documents[0].regional.taskReviews[0].sources[0].title = 'COPY_ONLY';
    }
    assert.deepEqual(record, before);
    for (const country of ['KR', 'IT', 'SA', 'CA-QC']) assert.equal(field(make(country, language), 'ruElectricalReissue'), undefined);
  }
});

test('electrical closure has technical amendment evidence and cannot silently upgrade a saved draft', () => {
  const doc = make('RU'), r = doc.regional.taskReviews[0].requirements;
  assert.ok(r.sources.some(s => s.url.endsWith('/31327') && s.scope.includes('All 11 pages')));
  assert.match(taskSafetyText('en', 'ruElectricalReissue'), /more than half/);
  assert.match(taskSafetyText('en', 'ruElectricalRecords'), /separate retention/);
  doc.regional.taskReviews[0].status = 'partial-source-review';
  doc.regional.version = '2026-10-06.26';
  doc.blocks = doc.blocks.filter(b => b.field?.key !== 'electrical.ruElectricalReissue');
  const copy = startWork({ data: { documents: [doc] } }).documents[0];
  assert.equal(copy.regional.version, '2026-10-06.26');
  assert.equal(copy.regional.taskReviews[0].status, 'partial-source-review');
  assert.equal(field(copy, 'ruElectricalReissue'), undefined);
});
