import test from 'node:test';
import assert from 'node:assert/strict';
import { WORK_JURISDICTIONS } from '../src/utils/workJurisdiction.js';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { TASK_TYPES, taskReview, taskLabel } from '../src/utils/regionalTaskReview.js';
import { TASK_SAFETY_LANGUAGES, TASK_SAFETY_TEXT, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { cleanPackage, duplicatePackage, startWork } from '../src/utils/workPackages.js';
import { REGIONAL_REQUIREMENT_REVIEW } from '../src/utils/regionalRequirementReview.js';

const ctx = (jurisdiction, documentLocale = 'en-US') => ({ jurisdiction, documentLocale });
const make = (jurisdiction, taskTypes = TASK_TYPES, documentLocale = 'en-US') => createRegionalTemplate('permit_to_work', ctx(jurisdiction, documentLocale), null, { taskTypes });
test('all 18 jurisdictions expose four opt-in task checks before permit signatures', () => {
  for (const profile of WORK_JURISDICTIONS) {
    const plain = make(profile.id, [], profile.locale);
    assert.equal(plain.regional.taskReviews, undefined);
    for (const topic of TASK_TYPES) {
      const doc = make(profile.id, [topic], profile.locale);
      assert.deepEqual(doc.regional.taskReviews.map(r => r.topic), [topic]);
      const keys = doc.blocks.flatMap(b => b.field ? [b.field.key] : []);
      assert.ok(keys.includes(topic + '.applicability'));
      assert.ok(keys.includes(topic + '.competence'));
      assert.ok(keys.includes(topic + '.stop'));
      assert.ok(keys.indexOf(topic + '.stop') < keys.indexOf('applicant'));
      assert.equal(new Set(keys).size, keys.length);
      assert.equal(doc.regional.status, 'site-review-draft');
      assert.equal(doc.regional.taskReviews[0].legalApplicability, 'site-and-sector-review-required');
      assert.ok(doc.regional.taskReviews[0].sources.every(s => s.scope && s.basis && s.url.startsWith('https://')));
    }
  }
});
test('fresh checks, measurements, calibration and personnel cannot become saved standard values', () => {
  for (const profile of WORK_JURISDICTIONS) {
    const doc = make(profile.id);
    for (const b of doc.blocks) {
      if (b.field?.key.includes('.')) {
        if (b.field.key.endsWith('.notice') || b.field.key.endsWith('.references')) continue;
        assert.equal(b.field.value, ''); assert.equal(b.field.mode, 'runtime');
        b.field.value = 'PAST_RESULT'; b.field.mode = 'standard';
      }
      if (b.type === 'table' && b.columns.some(c => c.key === 'criteria')) {
        for (const c of b.columns) {
          assert.equal(c.mode, 'runtime');
          for (const row of b.rows) row.values[c.id] = 'PAST_MEASUREMENT';
        }
      }
    }
    const record = { id: 'test', data: cleanPackage({ context: ctx(profile.id), documents: [doc] }) };
    assert.doesNotMatch(JSON.stringify(record), /PAST_/);
    assert.deepEqual(startWork(record).values, {});
  }
});
test('saved task evidence is copied independently and preserved in job snapshots', () => {
  const original = { id: 'test', data: cleanPackage({ context: ctx('CA-BC'), documents: [make('CA-BC', ['confined'])] }) };
  const before = structuredClone(original);
  const copy = duplicatePackage(original, 'Copy', 'ver.2');
  copy.data.documents[0].regional.taskReviews[0].sources[0].scope = 'Changed';
  copy.data.documents[0].blocks[0].field.value = 'Changed';
  assert.deepEqual(original, before);
  const run = startWork(original);
  assert.deepEqual(run.documents[0].regional.taskReviews, original.data.documents[0].regional.taskReviews);
  run.documents[0].regional.taskReviews[0].terms = 'Changed';
  assert.deepEqual(original, before);
});
test('jurisdiction terminology and applicability do not leak across countries sharing a language', () => {
  assert.match(taskLabel(ctx('FR','fr-FR'), 'confined'), /confiné/);
  assert.match(taskLabel(ctx('CA-QC','fr-CA-QC'), 'confined'), /clos/);
  assert.match(taskLabel(ctx('FR','fr-FR'), 'electrical'), /Consignation/);
  assert.match(taskLabel(ctx('CA-QC','fr-CA-QC'), 'electrical'), /Cadenassage/);
  assert.match(taskReview(ctx('CA-AB'), 'confined').terms, /tending worker/);
  assert.match(taskReview(ctx('CA-BC'), 'confined').terms, /standby person/);
  assert.match(taskReview(ctx('US'), 'confined').terms, /authorized entrant/);
  assert.match(taskReview(ctx('BR'), 'confined').terms, /PET.*vigia/);
  assert.deepEqual(taskReview(ctx('SG'), 'height').scopeNotes, ['sgHeightScope']);
  assert.deepEqual(taskReview(ctx('US'), 'confined').scopeNotes, ['usScope']);
  assert.ok(!taskReview(ctx('CA'), 'confined').scopeNotes.includes('usScope'));
  assert.ok(taskReview(ctx('AU'), 'height').scopeNotes.includes('auScope'));
  assert.ok(taskReview(ctx('BR'), 'hot').scopeNotes.includes('marineScope'));
});
test('unresolved current-law reviews remain explicit in saved data and printed form content', () => {
  for (const jurisdiction of ['RU','SA']) {
    const doc = make(jurisdiction);
    assert.ok(doc.regional.taskReviews.every(r => r.status === 'partial-source-review'));
    assert.ok(doc.blocks.filter(b => b.field?.key.endsWith('.notice')).every(b => b.field.value.includes(taskSafetyText('en-US','pending'))));
  }
  assert.equal(taskReview(ctx('BR'), 'height').status, 'partial-source-review');
  assert.ok(taskReview(ctx('RU'), 'electrical').sources.every(s => s.basis === 'historical-publication'));
  assert.equal(taskReview(ctx('AU'), 'confined').sources[0].basis, 'model-code');
});
test('all specialist wording supports ten languages and follows document language independently', () => {
  for (const [key, translations] of Object.entries(TASK_SAFETY_TEXT)) {
    assert.deepEqual(Object.keys(translations), TASK_SAFETY_LANGUAGES, key);
    for (const text of Object.values(translations)) assert.ok(text.trim());
  }
  for (const locale of TASK_SAFETY_LANGUAGES) {
    const documentLocale = WORK_JURISDICTIONS.find(p => p.locale.split('-')[0] === locale).locale;
    const doc = make('SG', ['confined'], documentLocale);
    assert.ok(doc.blocks.some(b => b.field?.label.includes(taskSafetyText(locale,'entryRoles'))));
  }
});
test('selection is explicit, deterministic and isolated from other document kinds', () => {
  assert.deepEqual(make('SG',['hot','hot','unknown','confined']).regional.taskReviews.map(r => r.topic), ['confined','hot']);
  assert.equal(make('SG','confined').regional.taskReviews, undefined);
  assert.equal(createRegionalTemplate('risk_assessment', ctx('SG'), null, { taskTypes: TASK_TYPES }).regional.taskReviews, undefined);
  assert.throws(() => taskReview(ctx('UNKNOWN'), 'confined'), /UNAVAILABLE/);
  assert.throws(() => taskReview(ctx('SG'), 'unknown'), /UNAVAILABLE/);
});

test('permit lifecycle differences remain local, including Ontario verification versus signed approval', () => {
  const fields = (country, topic = 'confined') => make(country, [topic]).blocks.filter(b => b.field).map(b => b.field);
  const has = (country, key, topic) => fields(country, topic).some(f => f.key.endsWith('.' + key));
  assert.ok(has('US', 'entryAuthorisation'));
  assert.ok(has('CA-AB', 'entryAuthorisation'));
  assert.ok(!has('CA-ON', 'entryAuthorisation'));
  assert.ok(has('CA-ON', 'shiftVerification'));
  assert.ok(has('CA-BC', 'shiftAuthorisation'));
  assert.ok(!has('CA-ON', 'shiftAuthorisation'));
  assert.ok(has('SG', 'dailyReview'));
  assert.ok(!has('US', 'dailyReview'));
  assert.ok(has('BR', 'routineClassification', 'height'));
  assert.ok(!has('AU', 'routineClassification', 'height'));
  assert.ok(has('FR', 'employerAuthorisation', 'electrical'));
  assert.ok(!has('CA-QC', 'employerAuthorisation', 'electrical'));
  assert.ok(has('SG', 'licenceScope', 'electrical'));
  assert.ok(!has('US', 'licenceScope', 'electrical'));
  const onNotice = fields('CA-ON').find(f => f.key === 'confined.notice').value;
  assert.match(onNotice, /before each shift/);
  assert.match(onNotice, /signature or entrance posting is not itself mandatory/);
  // Canadian provincial rules never inherit the general-industry US retention claim.
  assert.doesNotMatch(onNotice, /1910\.146/);
});

test('country supplements are translated in every document language without leaking language-specific roles', () => {
  for (const jurisdiction of WORK_JURISDICTIONS) {
    for (const locale of TASK_SAFETY_LANGUAGES) {
      const doc = make(jurisdiction.id, TASK_TYPES, locale === 'ko' ? locale : WORK_JURISDICTIONS.find(p => p.locale.startsWith(locale + '-')).locale);
      for (const review of doc.regional.taskReviews) {
        if (!review.requirements) continue;
        const evidence = review.requirements;
        for (const key of [evidence.noteKey, ...evidence.fields]) {
          assert.ok(TASK_SAFETY_TEXT[key]?.[locale], `${jurisdiction.id}/${locale}/${key}`);
        }
        assert.ok(doc.blocks.find(b => b.field?.key === review.topic + '.notice').field.value.includes(taskSafetyText(locale, evidence.noteKey)));
        for (const key of evidence.fields) {
          const f = doc.blocks.find(b => b.field?.key === `${review.topic}.${key}`).field;
          assert.ok(f.label.includes(taskSafetyText(locale, key)));
          assert.equal(f.value, '');
          assert.equal(f.mode, 'runtime');
        }
      }
    }
  }
  // Japanese screen/document language must not turn a Singapore job into a
  // Japanese oxygen-deficiency statutory classification or operations-chief role.
  const singaporeJapanese = make('SG', ['confined'], 'ja-JP');
  assert.equal(taskLabel(ctx('SG', 'ja-JP'), 'confined'), '閉所作業');
  assert.doesNotMatch(singaporeJapanese.blocks.find(b => b.field?.key === 'confined.entryRoles').field.label, /作業主任者/);
  assert.match(taskReview(ctx('JP'), 'confined').terms, /作業主任者/);
  assert.match(taskReview(ctx('SG'), 'electrical').terms, /Licensed Electrical Worker/);
});

test('review evidence is dated by scope and does not upgrade unresolved countries or rewrite saved forms', () => {
  const us = taskReview(ctx('US'), 'confined');
  assert.equal(us.checkedAt, '2026-10-03');
  assert.equal(us.requirements.checkedAt, '2026-10-04');
  assert.equal(us.sources.find(s => s.url.includes('1910.146')).checkedAt, '2026-10-04');
  assert.equal(taskReview(ctx('US'), 'hot').requirements, undefined);
  for (const country of ['SA', 'RU']) {
    assert.ok(make(country).regional.taskReviews.every(r => r.status === 'partial-source-review' && !r.requirements));
  }
  const doc = make('CA-BC', ['confined']);
  const original = { id: 'historical', data: cleanPackage({ context: ctx('CA-BC'), documents: [doc] }) };
  const snapshot = startWork(original);
  const copy = duplicatePackage(original, 'Independent', 'ver.2');
  copy.data.documents[0].regional.taskReviews[0].requirements.fields.push('changed');
  assert.ok(!snapshot.documents[0].regional.taskReviews[0].requirements.fields.includes('changed'));
  assert.ok(!original.data.documents[0].regional.taskReviews[0].requirements.fields.includes('changed'));
  us.requirements.fields.push('mutated');
  assert.ok(!REGIONAL_REQUIREMENT_REVIEW.US.confined.fields.includes('mutated'));
});
