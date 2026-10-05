import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { FINAL_TASK_REVIEW, FINAL_TASK_CLOSABLE_IDS, FINAL_TASK_VERSION } from '../src/utils/regionalFinalTaskReview20261006.js';
import { startWork, duplicatePackage } from '../src/utils/workPackages.js';
import { TASK_SAFETY_LANGUAGES, TASK_SAFETY_TEXT, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { taskFingerprint } from './regional-task-fingerprint.js';
import { formFingerprint } from './regional-form-fingerprint.js';

const field = (doc, key) => doc.blocks.find(b => b.field?.key === key)?.field;
const make = (country, topic, language) => createRegionalTemplate('permit_to_work', {
  jurisdiction: country, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language),
}, null, { taskTypes: [topic] });

test('24 task supplements retain current-work blanks and individual evidence status in all ten languages', () => {
  assert.equal(Object.keys(FINAL_TASK_REVIEW).length, 24);
  assert.equal(FINAL_TASK_CLOSABLE_IDS.length, 14);
  for (const [id, review] of Object.entries(FINAL_TASK_REVIEW)) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, topic] = id.split('.'), doc = make(country, topic, language), metadata = doc.regional.taskReviews[0];
    assert.equal(doc.regional.version, FINAL_TASK_VERSION);
    assert.equal(doc.regional.status, 'site-review-draft');
    assert.equal(metadata.legalApplicability, 'site-and-sector-review-required');
    assert.equal(metadata.status, review.pending ? 'partial-source-review' : 'scoped-source-review', id);
    assert.equal(metadata.requirements.checkedAt, '2026-10-06');
    for (const key of review.fields) {
      const f = field(doc, `${topic}.${key}`);
      assert.equal(f.kind, key === 'entryAuthorisation' ? 'worker' : 'verification');
      assert.equal(f.mode, 'runtime'); assert.equal(f.value, '');
      assert.ok(f.label.includes(taskSafetyText(language, key)), `${id}.${key}.${language}`);
    }
    for (const key of [review.note, review.replaceNote].filter(Boolean)) assert.ok(field(doc, `${topic}.notice`).value.includes(taskSafetyText(language, key)));
    assert.equal(field(doc, `${topic}.notice`).value.includes(taskSafetyText(language, 'pending')), !!review.pending);
    assert.ok(review.sources.every(s => metadata.sources.some(r => r.url === s.url && r.checkedAt === s.checkedAt)));
    const keys = doc.blocks.flatMap(b => b.field ? [b.field.key] : []);
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(keys.filter(k => /^(height|confined|electrical|hot)\./.test(k)).every(k => k.startsWith(topic + '.')));
  }
});

test('country-specific record periods and authorisation concepts cannot leak across jurisdictions', () => {
  const cases = [
    ['JP', 'confined', 'jpAtmosphereRecord'], ['IT', 'confined', 'itContractReview'],
    ['BR', 'electrical', 'brServiceOrder'], ['BR', 'confined', 'brPetSignatures'],
    ['CA-QC', 'height', 'qcRescueSchedule'], ['CA-QC', 'confined', 'qcEntryRecords'],
  ];
  for (const [owner, topic, key] of cases) for (const language of TASK_SAFETY_LANGUAGES) for (const country of ['JP', 'IT', 'BR', 'CA-QC', 'SA', 'RU', 'FR', 'KR']) {
    assert.equal(!!field(make(country, topic, language), `${topic}.${key}`), country === owner);
  }
  assert.match(TASK_SAFETY_TEXT.qcEntryRecords.en, /nonconforming/);
  assert.match(TASK_SAFETY_TEXT.qcRescueSchedule.en, /construction.*CSTC/);
  assert.match(TASK_SAFETY_TEXT.brPetSignatures.en, /supervisor and vigia/);
  assert.match(field(make('JP', 'electrical', 'en'), 'electrical.disconnect').label, /OR/);
  assert.match(field(make('KR', 'electrical', 'en'), 'electrical.disconnect').label, /locks and tags/);
});

test('source gaps remain explicit while three resolved source issues require dated evidence', () => {
  for (const country of ['SA', 'RU']) for (const topic of ['height', 'confined', 'electrical', 'hot']) {
    const r = make(country, topic, 'en').regional.taskReviews[0];
    assert.equal(r.requirements.partial, true);
    assert.equal(r.status, 'partial-source-review');
    if (country === 'SA') assert.ok(r.sources.some(s => s.basis === 'company-guidance'));
  }
  for (const [country, topic] of [['IT', 'electrical'], ['CA-QC', 'hot']]) assert.equal(make(country, topic, 'en').regional.taskReviews[0].status, 'partial-source-review');
  for (const [country, topic, issue] of [['IT', 'height', 'it-current-height-consolidation'], ['BR', 'height', 'br-current-nr35-publication-date'], ['CA-QC', 'confined', 'qc-current-rsst-cstc-confined']]) {
    const r = make(country, topic, 'en').regional.taskReviews[0];
    assert.equal(r.requirements.partial, false);
    assert.ok(r.requirements.resolvedIssues.includes(issue));
    assert.ok(r.requirements.sources.some(s => s.checkedAt === '2026-10-06'));
  }
});

test('all new confirmations and people reset in new work and independent copies even with legacy standard mode', () => {
  for (const id of Object.keys(FINAL_TASK_REVIEW)) for (const language of TASK_SAFETY_LANGUAGES) {
    const [country, topic] = id.split('.'), doc = make(country, topic, language);
    for (const b of doc.blocks) {
      if (b.field && ['verification', 'worker'].includes(b.field.kind)) { b.field.value = 'OLD_ACTUAL'; b.field.mode = 'standard'; }
      for (const c of b.columns || []) if (['measurement', 'measuredAt', 'measuredBy', 'verification', 'worker'].includes(c.kind)) {
        c.mode = 'standard'; for (const row of b.rows) row.values[c.id] = 'OLD_ACTUAL';
      }
    }
    const record = { data: { context: doc.regional.context, documents: [doc] } }, original = structuredClone(record);
    for (const copy of [startWork(record), duplicatePackage(record, 'night', 'ver.2').data]) {
      assert.doesNotMatch(JSON.stringify(copy), /OLD_ACTUAL/);
      assert.deepEqual(copy.documents[0].regional.taskReviews, doc.regional.taskReviews);
      copy.documents[0].regional.taskReviews[0].sources[0].title = 'COPY_ONLY';
    }
    assert.deepEqual(record, original);
  }
});

test('task closure fingerprints notice meaning without changing generic form fingerprints', () => {
  const hash = taskFingerprint('task:JP.confined'), base = formFingerprint('form:JP.permit_to_work');
  assert.equal(taskFingerprint('task:JP.confined'), hash);
  const original = TASK_SAFETY_TEXT.jpEntryLifecycleNote.en;
  try {
    TASK_SAFETY_TEXT.jpEntryLifecycleNote.en = 'CHANGED MEANING';
    assert.notEqual(taskFingerprint('task:JP.confined'), hash);
    assert.equal(formFingerprint('form:JP.permit_to_work'), base);
  } finally { TASK_SAFETY_TEXT.jpEntryLifecycleNote.en = original; }
  assert.equal(taskFingerprint('task:JP.confined'), hash);
});

test('saved documents keep their old version and field set through new-work copying', () => {
  const doc = make('BR', 'electrical', 'pt');
  doc.regional.version = 'saved-old-version';
  doc.regional.taskReviews[0].requirements.version = 'saved-old-evidence';
  doc.blocks = doc.blocks.filter(b => b.field?.key !== 'electrical.brServiceOrder');
  const result = startWork({ data: { documents: [doc] } }).documents[0];
  assert.equal(result.regional.version, 'saved-old-version');
  assert.equal(result.regional.taskReviews[0].requirements.version, 'saved-old-evidence');
  assert.equal(field(result, 'electrical.brServiceOrder'), undefined);
});
