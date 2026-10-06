import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { DE_FR_TASK_REVIEW, DE_FR_TASK_VERSION } from '../src/utils/regionalDeFrTaskReview20261006.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, TASK_SAFETY_TEXT, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { taskFingerprint } from './regional-task-fingerprint.js';
import { formFingerprint } from './regional-form-fingerprint.js';

const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;
const context = (jurisdiction, language) => ({ jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language) });
const make = (jurisdiction, topic, language) => createRegionalTemplate('permit_to_work', context(jurisdiction, language), null, { taskTypes: [topic] });

test('eight task supplements carry fresh records and matching jurisdiction evidence in ten languages', () => {
  assert.equal(Object.keys(DE_FR_TASK_REVIEW).length, 8);
  for (const [id, review] of Object.entries(DE_FR_TASK_REVIEW)) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, topic] = id.split('.');
    const doc = make(country, topic, language);
    assert.equal(doc.regional.version, DE_FR_TASK_VERSION);
    assert.equal(doc.regional.status, 'site-review-draft');
    assert.equal(doc.regional.taskReviews[0].version, DE_FR_TASK_VERSION);
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

test('German roles and French authorisation boundaries remain local in every document language', () => {
  for (const language of TASK_SAFETY_LANGUAGES) {
    for (const [country, topic, key] of [['DE', 'confined', 'deEntryLifecycleNote'], ['FR', 'confined', 'frEntryMonitoringNote'], ['FR', 'electrical', 'frElectricalBoundaryNote'], ['FR', 'hot', 'frHotLifecycleNote']]) {
      for (const other of ['DE', 'FR', 'CA', 'GB']) assert.equal(field(make(other, topic, language), topic + '.notice').value.includes(taskSafetyText(language, key)), other === country);
    }
    assert.ok(field(make('DE', 'electrical', language), 'electrical.deElectricalRelease'));
    assert.equal(field(make('FR', 'electrical', language), 'electrical.deElectricalRelease'), undefined);
    assert.ok(field(make('FR', 'height', language), 'height.frHeightRescue'));
    assert.equal(field(make('DE', 'height', language), 'height.frHeightRescue'), undefined);
  }
  assert.match(TASK_SAFETY_TEXT.deEntryLifecycleNote.en, /not automatic/);
  assert.match(TASK_SAFETY_TEXT.frEntryMonitoringNote.en, /attendant does not enter/);
  assert.match(TASK_SAFETY_TEXT.frElectricalBoundaryNote.en, /without recording diagnoses/);
  assert.match(TASK_SAFETY_TEXT.frHotLifecycleNote.en, /not universal statutory periods/);
});

test('new task decisions cannot survive new-work or copy reset even after a user changes their modes', () => {
  for (const id of Object.keys(DE_FR_TASK_REVIEW)) for (const language of TASK_SAFETY_LANGUAGES) {
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
  const hash = taskFingerprint('task:FR.confined');
  assert.equal(taskFingerprint('task:FR.confined'), hash);
  const base = formFingerprint('form:FR.permit_to_work');
  const original = TASK_SAFETY_TEXT.frEntryMonitoringNote.en;
  try {
    TASK_SAFETY_TEXT.frEntryMonitoringNote.en = 'A CHANGED SAFETY INSTRUCTION';
    assert.notEqual(taskFingerprint('task:FR.confined'), hash);
    assert.equal(formFingerprint('form:FR.permit_to_work'), base);
  } finally { TASK_SAFETY_TEXT.frEntryMonitoringNote.en = original; }
  assert.equal(taskFingerprint('task:FR.confined'), hash);
});

test('saved task versions and printed-source metadata are preserved instead of regenerated', () => {
  const doc = make('DE', 'electrical', 'en');
  doc.regional.version = 'saved-old-version';
  doc.regional.taskReviews[0].requirements.version = 'saved-old-evidence';
  doc.blocks = doc.blocks.filter(b => b.field?.key !== 'electrical.restorationRelease');
  const result = startWork({ data: { documents: [doc] } }).documents[0];
  assert.equal(result.regional.version, 'saved-old-version');
  assert.equal(result.regional.taskReviews[0].requirements.version, 'saved-old-evidence');
  assert.equal(field(result, 'electrical.restorationRelease'), undefined);
});
