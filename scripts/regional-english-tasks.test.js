import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { ENGLISH_TASK_REVIEW, ENGLISH_TASK_VERSION } from '../src/utils/regionalEnglishTaskReview20261006.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
import { taskReview } from '../src/utils/regionalTaskReview.js';
import { TASK_SAFETY_LANGUAGES, TASK_SAFETY_TEXT, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { taskFingerprint } from './regional-task-fingerprint.js';
import { formFingerprint } from './regional-form-fingerprint.js';

const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;
const context = (jurisdiction, language) => ({ jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language) });
const make = (jurisdiction, topic, language) => createRegionalTemplate('permit_to_work', context(jurisdiction, language), null, { taskTypes: [topic] });

test('twelve task supplements carry fresh records and matching jurisdiction evidence in ten languages', () => {
  assert.equal(Object.keys(ENGLISH_TASK_REVIEW).length, 12);
  for (const [id, review] of Object.entries(ENGLISH_TASK_REVIEW)) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, topic] = id.split('.');
    const doc = make(country, topic, language);
    assert.equal(doc.regional.version, ENGLISH_TASK_VERSION);
    assert.equal(doc.regional.status, 'site-review-draft');
    assert.equal(doc.regional.taskReviews[0].version, ENGLISH_TASK_VERSION);
    assert.equal(doc.regional.taskReviews[0].requirements.checkedAt, '2026-10-06');
    assert.equal(doc.regional.taskReviews[0].legalApplicability, 'site-and-sector-review-required');
    for (const key of review.fields) {
      const f = field(doc, `${topic}.${key}`);
      assert.equal(f.kind, key === 'entryAuthorisation' ? 'worker' : 'verification');
      assert.equal(f.mode, 'runtime');
      assert.equal(f.value, '');
      assert.ok(f.label.includes(taskSafetyText(language, key)));
    }
    if (review.note) assert.ok(field(doc, `${topic}.notice`).value.includes(taskSafetyText(language, review.note)));
    assert.ok(review.sources.every(s => doc.regional.taskReviews[0].sources.some(r => r.url === s.url && r.checkedAt === s.checkedAt)));
    assert.equal(new Set(doc.blocks.filter(b => b.field).map(b => b.field.key)).size, doc.blocks.filter(b => b.field).length);
    assert.ok(doc.blocks.every(b => !b.field || !/^(height|confined|electrical|hot)\./.test(b.field.key) || b.field.key.startsWith(topic + '.')));
  }
});

test('regional exceptions and guidance durations remain distinct when document language changes', () => {
  for (const language of TASK_SAFETY_LANGUAGES) {
    const usEntry = field(make('US', 'confined', language), 'confined.notice').value;
    assert.ok(usEntry.includes(taskSafetyText(language, 'usEntryPathNote')));
    assert.ok(!field(make('GB', 'confined', language), 'confined.notice').value.includes(taskSafetyText(language, 'usEntryPathNote')));
    assert.ok(field(make('CA', 'hot', language), 'hot.notice').value.includes(taskSafetyText(language, 'caWatchGuidanceNote')));
    assert.ok(!field(make('US', 'hot', language), 'hot.notice').value.includes(taskSafetyText(language, 'caWatchGuidanceNote')));
    for (const province of ['CA-AB', 'CA-ON', 'CA-BC', 'CA-QC']) {
      const review = taskReview(context(province, language), 'hot');
      assert.notEqual(review.requirements.version, ENGLISH_TASK_VERSION);
      assert.ok(!(review.requirements.additionalNotes || []).includes('caWatchGuidanceNote'));
    }
  }
  assert.match(TASK_SAFETY_TEXT.usEntryPathNote.en, /ventilation control alone is not hazard elimination/i);
  assert.match(TASK_SAFETY_TEXT.usHotProhibitionNote.en, /cannot override/);
  assert.match(TASK_SAFETY_TEXT.caWatchGuidanceNote.en, /not a nationwide statutory/);
  assert.match(TASK_SAFETY_TEXT.gbEntryPermitScope.en, /not required for every/);
});

test('new task decisions cannot survive new-work or copy reset even after a user changes their modes', () => {
  for (const id of Object.keys(ENGLISH_TASK_REVIEW)) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, topic] = id.split('.'), doc = make(country, topic, language);
    const notice = field(doc, `${topic}.notice`).value;
    for (const b of doc.blocks) {
      if (b.field && ['verification', 'worker'].includes(b.field.kind)) {
        b.field.value = 'OLD_APPROVAL'; b.field.mode = 'standard';
      }
      for (const c of b.columns || []) if (['measurement', 'measuredAt', 'measuredBy', 'verification', 'worker'].includes(c.kind)) {
        c.mode = 'standard';
        for (const row of b.rows) row.values[c.id] = 'OLD_APPROVAL';
      }
    }
    const record = { data: { context: doc.regional.context, documents: [doc] } }, original = structuredClone(record);
    for (const copy of [startWork(record), duplicatePackage(record, 'night', 'ver.2').data]) {
      assert.doesNotMatch(JSON.stringify(copy), /OLD_APPROVAL/);
      assert.equal(field(copy.documents[0], `${topic}.notice`).value, notice);
      assert.deepEqual(copy.documents[0].regional.taskReviews, doc.regional.taskReviews);
      copy.documents[0].regional.taskReviews[0].sources[0].title = 'COPY_ONLY';
    }
    assert.deepEqual(record, original);
  }
});

test('task closure detects semantic changes and ignores random document IDs without changing generic permits', () => {
  const hash = taskFingerprint('task:US.hot');
  assert.equal(taskFingerprint('task:US.hot'), hash);
  const base = formFingerprint('form:US.permit_to_work');
  const original = TASK_SAFETY_TEXT.hotFireProtection.en;
  try {
    TASK_SAFETY_TEXT.hotFireProtection.en = 'A CHANGED SAFETY INSTRUCTION';
    assert.notEqual(taskFingerprint('task:US.hot'), hash);
    assert.equal(formFingerprint('form:US.permit_to_work'), base);
  } finally { TASK_SAFETY_TEXT.hotFireProtection.en = original; }
  assert.equal(taskFingerprint('task:US.hot'), hash);
});

test('saved task versions and printed-source metadata are preserved instead of regenerated', () => {
  const doc = make('GB', 'electrical', 'en');
  doc.regional.version = 'saved-old-version';
  doc.regional.taskReviews[0].requirements.version = 'saved-old-evidence';
  doc.blocks = doc.blocks.filter(b => b.field?.key !== 'electrical.restorationRelease');
  const result = startWork({ data: { documents: [doc] } }).documents[0];
  assert.equal(result.regional.version, 'saved-old-version');
  assert.equal(result.regional.taskReviews[0].requirements.version, 'saved-old-evidence');
  assert.equal(field(result, 'electrical.restorationRelease'), undefined);
});
