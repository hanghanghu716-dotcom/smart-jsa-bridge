import test from 'node:test';
import assert from 'node:assert/strict';
import { WORK_JURISDICTIONS } from '../src/utils/workJurisdiction.js';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { TASK_TYPES, taskReview, taskLabel } from '../src/utils/regionalTaskReview.js';
import { TASK_SAFETY_LANGUAGES, TASK_SAFETY_TEXT, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { cleanPackage, duplicatePackage, startWork } from '../src/utils/workPackages.js';
import { REGIONAL_REQUIREMENT_REVIEW } from '../src/utils/regionalRequirementReview.js';
import { regionalText } from '../src/locales/regionalWorkText.js';
import { REQUIREMENT_REVIEW_REMAINING_20261005 } from '../src/utils/regionalRequirementReviewRemaining20261005.js';

const ctx = (jurisdiction, documentLocale = 'en-US') => ({ jurisdiction, documentLocale });
const make = (jurisdiction, taskTypes = TASK_TYPES, documentLocale = 'en-US') => createRegionalTemplate('permit_to_work', ctx(jurisdiction, documentLocale), null, { taskTypes });

test('Singapore current-law prompts preserve marine scope, blank checks and historical copy independence', () => {
  for (const lang of TASK_SAFETY_LANGUAGES) {
    const locale = WORK_JURISDICTIONS.find(p => p.locale.split('-')[0] === lang).locale;
    const doc = make('SG', ['height', 'hot'], locale);
    const keys = ['height.sgAnchorRegister', 'height.sgRopeRegister', 'height.sgJointInspection',
      'height.permitDisplay', 'height.permitRecord', 'hot.sgJointInspection', 'hot.sgHotBasisSketch',
      'hot.sgHotEquipmentRegister', 'hot.sgHotBreakRestart', 'hot.permitDisplay'];
    for (const key of keys) {
      const f = doc.blocks.find(b => b.field?.key === key).field;
      assert.equal(f.value, ''); assert.equal(f.mode, 'runtime');
      // Imported/edited templates cannot turn a previous inspection into a default.
      f.value = 'SG_PAST_INSPECTION'; f.mode = 'standard';
    }
    for (const r of doc.regional.taskReviews) {
      assert.equal(r.status, 'scoped-source-review');
      assert.match(r.requirements.remaining, /Local adoption, site decisions, engineered designs, incorporated standards and statutory permits remain separate/);
      assert.ok(r.sources.some(s => s.url.startsWith('https://sso.agc.gov.sg/') && ['2026-10-05', '2026-10-06'].includes(s.checkedAt)));
    }
    const record = { id: 'sg-review', data: cleanPackage({ context: ctx('SG', locale), documents: [doc] }) };
    const before = structuredClone(record);
    const run = startWork(record);
    assert.doesNotMatch(JSON.stringify(run), /SG_PAST_INSPECTION/);
    assert.deepEqual(run.documents[0].regional.taskReviews, doc.regional.taskReviews);
    duplicatePackage(record, 'Independent SG', 'ver.2').data.documents[0].regional.taskReviews[0].requirements.sources[0].scope = 'changed';
    assert.deepEqual(record, before);
    assert.ok(doc.regional.taskReviews.find(r => r.topic === 'hot').scopeNotes.includes('marineScope'));
  }
  const sg = make('SG', ['height', 'hot']);
  assert.match(sg.blocks.find(b => b.field?.key === 'hot.sgHotEquipmentRegister').field.label, /30 days.*14 days.*12 months/);
  assert.match(sg.blocks.find(b => b.field?.key === 'height.notice').field.value, /exceeding 3 m/);
  for (const j of WORK_JURISDICTIONS.filter(p => p.id !== 'SG')) {
    assert.ok(!make(j.id).blocks.some(b => b.field?.key.includes('.sg')));
  }
});
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
  const russian = taskReview(ctx('RU'), 'electrical');
  assert.ok(russian.sources.some(s => s.basis === 'historical-publication'));
  assert.ok(russian.sources.some(s => s.basis === 'official-notice'));
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
        for (const key of [evidence.noteKey, ...(evidence.additionalNotes || []), ...evidence.fields, ...Object.values(evidence.fieldLabels || {})]) {
          assert.ok(TASK_SAFETY_TEXT[key]?.[locale], `${jurisdiction.id}/${locale}/${key}`);
        }
        assert.ok(doc.blocks.find(b => b.field?.key === review.topic + '.notice').field.value.includes(taskSafetyText(locale, evidence.noteKey)));
        for (const key of evidence.additionalNotes || []) {
          assert.ok(doc.blocks.find(b => b.field?.key === review.topic + '.notice').field.value.includes(taskSafetyText(locale, key)));
        }
        for (const key of evidence.fields) {
          const f = doc.blocks.find(b => b.field?.key === `${review.topic}.${key}`).field;
          assert.ok(f.label.includes(taskSafetyText(locale, evidence.fieldLabels?.[key] || key)));
          assert.equal(f.value, '');
          assert.equal(f.mode, 'runtime');
        }
        for (const [fieldKey, labelKey] of Object.entries(evidence.fieldLabels || {})) {
          const f = doc.blocks.find(b => b.field?.key === `${review.topic}.${fieldKey}`).field;
          assert.ok(f.label.includes(taskSafetyText(locale, labelKey)));
          assert.equal(f.mode, 'runtime');
          assert.equal(f.value, '');
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

test('Brazil transitions preserve effective dates without preselecting compliance or reusing past evidence', () => {
  const electrical = make('BR', ['electrical'], 'pt-BR');
  const review = electrical.regional.taskReviews[0];
  // The ministry's undated nr-10.pdf was replaced with the future edition.
  // The first/current reference must not silently inherit that replacement.
  assert.match(review.sources[0].url, /nr-10-atualizada-2019-1\.pdf$/);
  assert.match(review.sources[0].title, /valid through 2027-05-31/);
  const future = review.sources.find(s => s.effectiveFrom);
  assert.equal(future.effectiveFrom, '2027-06-01');
  assert.deepEqual(future.transition, {
    clause: '10.6.4(e)', scope: 'installations existing when Portaria takes effect', effectiveFrom: '2028-06-01',
  });
  const notice = electrical.blocks.find(b => b.field?.key === 'electrical.notice').field.value;
  assert.match(notice, /2027-05-31/);
  assert.match(notice, /2027-06-01/);
  assert.match(notice, /10\.6\.4\(e\)/);
  assert.ok(!make('US', ['electrical'], 'pt-BR').blocks.some(b => b.field?.key.endsWith('.applicableEdition')));
  for (const [topic, keys] of [
    ['electrical', ['applicableEdition']],
    ['height', ['trainingDelivery', 'ladderAssessment', 'transitionEvidence']],
  ]) {
    const doc = make('BR', [topic]);
    for (const key of keys) {
      const field = doc.blocks.find(b => b.field?.key === `${topic}.${key}`).field;
      assert.equal(field.mode, 'runtime');
      assert.equal(field.value, '');
      field.mode = 'standard'; field.value = 'OLD_ELIGIBILITY';
    }
    const record = { id: 'transition', data: cleanPackage({ context: ctx('BR'), documents: [doc] }) };
    const run = startWork(record);
    assert.doesNotMatch(JSON.stringify(run), /OLD_ELIGIBILITY/);
    if (topic === 'electrical') {
      assert.deepEqual(run.documents[0].regional.taskReviews[0].sources.find(s => s.effectiveFrom), future);
    }
  }
  assert.ok(!make('US', ['electrical']).blocks.some(b => b.field?.key.endsWith('.applicableEdition')));
  assert.ok(!make('AU', ['height']).blocks.some(b => b.field?.key.endsWith('.transitionEvidence')));
});

test('Australian confined-space form records actual law without treating Victoria as model-WHS adoption', () => {
  const doc = make('AU', ['confined']);
  const field = doc.blocks.find(b => b.field?.key === 'confined.stateCodeBasis').field;
  assert.equal(field.value, '');
  assert.equal(field.mode, 'runtime');
  const notice = doc.blocks.find(b => b.field?.key === 'confined.notice').field.value;
  assert.match(notice, /Victoria has a separate OHS framework/);
  assert.ok(doc.regional.taskReviews[0].sources.some(s => s.url.includes('worksafe.vic.gov.au')));
  assert.ok(!make('US', ['confined']).blocks.some(b => b.field?.key.endsWith('.stateCodeBasis')));
});

test('review evidence is dated by scope and does not upgrade unresolved countries or rewrite saved forms', () => {
  const us = taskReview(ctx('US'), 'confined');
  assert.equal(us.checkedAt, '2026-10-03');
  assert.equal(us.requirements.checkedAt, '2026-10-06');
  assert.equal(us.sources.find(s => s.url.includes('1910.146')).checkedAt, '2026-10-06');
  assert.equal(taskReview(ctx('US'), 'hot').requirements.checkedAt, '2026-10-06');
  assert.equal(taskReview(ctx('DE'), 'hot').requirements.checkedAt, '2026-10-06');
  for (const country of ['SA', 'RU']) {
    assert.ok(make(country).regional.taskReviews.every(r => r.status === 'partial-source-review'));
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

test('US and GB checks preserve different evidence without prefilled clearances or automatic expiry', () => {
  const notice = (j, topic) => make(j, [topic]).blocks.find(b => b.field?.key === `${topic}.notice`).field.value;
  assert.match(notice('US', 'hot'), /at least 30 minutes/);
  assert.match(notice('US', 'hot'), /written permit is preferred/);
  assert.match(notice('GB', 'hot'), /extending to 60 minutes/);
  assert.doesNotMatch(notice('GB', 'hot'), /1910\.252/);
  assert.match(notice('US', 'electrical'), /Above nominal 600 V/);
  assert.match(notice('GB', 'electrical'), /Do not import the US 600 V condition/);
  for (const j of ['US', 'GB']) {
    const doc = make(j, ['height', 'electrical', 'hot']);
    for (const b of doc.blocks.filter(b => b.field?.kind === 'verification')) {
      assert.equal(b.field.value, '');
      b.field.mode = 'standard'; b.field.value = 'PAST_CLEARANCE';
    }
    const run = startWork({ data: cleanPackage({ context: ctx(j), documents: [doc] }) });
    assert.doesNotMatch(JSON.stringify(run), /PAST_CLEARANCE/);
  }
  assert.match(notice('SG', 'height'), /combining assessor\/manager requires checking conditions/);
  assert.match(notice('SG', 'height'), /not set the seven-day guidance as an automatic statutory expiry/);
  assert.equal(taskReview(ctx('SG'), 'height').status, 'scoped-source-review');
  assert.equal(taskReview(ctx('SG'), 'height').requirements.checkedAt, '2026-10-06');
});

test('KR and JP electrical rules preserve different isolation choices and native work-director roles', () => {
  const kr = make('KR', ['electrical']);
  const jp = make('JP', ['electrical']);
  const f = (doc, key) => doc.blocks.find(b => b.field?.key === `electrical.${key}`).field;
  assert.match(f(kr, 'notice').value, /locks AND tags/);
  assert.match(f(kr, 'lockRemoval').label, /by the installing worker/);
  assert.ok(!kr.blocks.some(b => b.field?.key === 'electrical.restorationRelease'));
  assert.match(f(jp, 'disconnect').label, /lock OR no-energisation notice OR watcher/);
  assert.ok(!f(kr, 'disconnect').label.includes('JP Article 339'));
  assert.match(f(jp, 'notice').value, /high\/extra-high voltage/);
  const jpNative = make('JP', ['electrical'], 'ja-JP');
  assert.match(f(jpNative, 'workLeader').label, /作業指揮者/);
  assert.doesNotMatch(f(jpNative, 'workLeader').label, /作業主任者/);
  assert.doesNotMatch(jpNative.regional.taskReviews[0].terms, /作業主任者/);
  assert.match(taskReview(ctx('JP'), 'confined').terms, /作業主任者/);
  // Document language must not transplant Japan's alternative isolation rule.
  assert.ok(!make('KR', ['electrical'], 'ja-JP').blocks.some(b => b.field?.label.includes('又は監視人')));
});

test('KR and JP height and hot-work supplements keep conditional measures in their jurisdiction', () => {
  const keys = (j, topic) => make(j, [topic]).blocks.flatMap(b => b.field ? [b.field.key] : []);
  assert.ok(keys('KR', 'height').includes('height.ladderConditions'));
  assert.ok(!keys('JP', 'height').includes('height.ladderConditions'));
  assert.ok(keys('JP', 'height').includes('height.ropeWorkPlan'));
  assert.ok(!keys('KR', 'height').includes('height.ropeWorkPlan'));
  assert.ok(keys('KR', 'hot').includes('hot.permitDisplay'));
  assert.ok(keys('KR', 'hot').includes('hot.fireBlanket'));
  assert.ok(!keys('JP', 'hot').includes('hot.fireBlanket'));
  assert.ok(keys('JP', 'hot').includes('hot.oxygenExclusion'));
  for (const j of ['KR', 'JP']) {
    const doc = make(j, ['height', 'hot']);
    const notice = doc.blocks.find(b => b.field?.key === 'hot.notice').field.value;
    assert.doesNotMatch(notice, /at least 30 minutes/);
    assert.ok(doc.regional.taskReviews.every(r => r.requirements.sources.every(s => s.basis === 'regulation')));
  }
  assert.match(taskSafetyText('en', 'fireBlanket'), /When a welding fire blanket is used/);
  assert.match(taskSafetyText('en', 'ropeWorkPlan'), /If applicable/);
  assert.match(taskSafetyText('en', 'krHotDetail'), /conditions\/exceptions separately/);
  assert.match(taskSafetyText('en', 'jpHotDetail'), /do not establish a nationwide written-permit rule/);
});

test('local isolation labels survive job snapshots and copies without mutating saved forms or reusing checks', () => {
  const doc = make('JP', ['electrical']);
  const disconnect = doc.blocks.find(b => b.field?.key === 'electrical.disconnect').field;
  disconnect.mode = 'standard'; disconnect.value = 'OLD_ISOLATION';
  const record = { id: 'jp-isolation', data: cleanPackage({ context: ctx('JP'), documents: [doc] }) };
  const before = structuredClone(record);
  const run = startWork(record);
  const copy = duplicatePackage(record, 'Separate', 'ver.2');
  assert.doesNotMatch(JSON.stringify(run), /OLD_ISOLATION/);
  assert.equal(run.documents[0].regional.taskReviews[0].requirements.fieldLabels.disconnect, 'jpIsolationChoice');
  copy.data.documents[0].regional.taskReviews[0].requirements.fieldLabels.disconnect = 'changed';
  run.documents[0].regional.taskReviews[0].requirements.fieldLabels.disconnect = 'changed-run';
  assert.deepEqual(record, before);
  assert.equal(taskReview(ctx('JP'), 'electrical').requirements.fieldLabels.disconnect, 'jpIsolationChoice');
  assert.equal(taskReview(ctx('KR'), 'electrical').requirements.fieldLabels, undefined);
});

test('Russian document language does not turn foreign generic forms into Russian statutory records', () => {
  assert.equal(regionalText('ru-RU', 'Permit to Work'), 'Разрешение на работы');
  assert.equal(regionalText('ru-RU', 'Toolbox Talk'), 'Обсуждение безопасности перед работой');
  assert.doesNotMatch(regionalText('ru-RU', 'Briefing leader and time'), /инструктаж/);
  const title = createRegionalTemplate('toolbox_talk', ctx('FR', 'ru-RU')).title;
  assert.match(title, /Обсуждение безопасности/);
  assert.match(title, /Causerie sécurité/);
  assert.doesNotMatch(title, /инструктаж/);
  // Explicit local terms remain available for the actual Russian task context.
  assert.match(taskReview(ctx('RU'), 'height').terms, /наряд-допуск/);
  assert.doesNotMatch(taskSafetyText('ru-RU', 'applicability'), /наряд-допуск/);
  assert.doesNotMatch(taskSafetyText('ar-SA', 'entryRoles'), /مشرف الدخول/);
  assert.match(taskSafetyText('ja-JP', 'fallSystem'), /クリアランス/);
  assert.match(taskSafetyText('pt-BR', 'fallSystem'), /restrição de movimentação\/retenção de queda/);
});

test('Ontario signed assessment is distinct from shift permit verification and retains current statutory evidence', () => {
  const doc = make('CA-ON', ['confined']);
  const keys = doc.blocks.flatMap(b => b.field ? [b.field.key] : []);
  for (const key of ['assessmentEndorsement', 'shiftVerification', 'planReference', 'trainingEvidence', 'employerCoordination', 'rescueReadiness', 'atmosphericBasis']) {
    assert.ok(keys.includes('confined.' + key));
    const f = doc.blocks.find(b => b.field?.key === 'confined.' + key).field;
    assert.equal(f.value, '');
    assert.equal(f.mode, 'runtime');
  }
  assert.ok(!keys.includes('confined.entryAuthorisation'));
  assert.equal(doc.regional.taskReviews[0].status, 'scoped-source-review');
  assert.ok(doc.regional.taskReviews[0].sources.some(s => s.basis === 'regulation' && s.url.endsWith('/050632')));
  const note = doc.blocks.find(b => b.field?.key === 'confined.notice').field.value;
  assert.match(note, /assessor's signature and date/);
  assert.match(note, /before multi-employer work/);
  assert.match(note, /longer of one year/);
  assert.ok(!make('US', ['confined']).blocks.some(b => b.field?.key.endsWith('.employerCoordination')));
});

test('Quebec construction and Saudi scaffold guidance preserve limited applicability', () => {
  const qc = make('CA-QC', ['confined'], 'fr-CA-QC');
  assert.equal(qc.regional.taskReviews[0].status, 'partial-source-review');
  assert.match(qc.blocks.find(b => b.field?.key === 'confined.notice').field.value, /RSST.*CSTC/);
  assert.ok(qc.blocks.some(b => b.field?.key === 'confined.jointHazardRecord'));
  const sa = make('SA', ['height'], 'ar-SA');
  assert.equal(sa.regional.taskReviews[0].status, 'partial-source-review');
  assert.ok(sa.blocks.some(b => b.field?.key === 'height.scaffoldInspection'));
  assert.ok(sa.regional.taskReviews[0].requirements.sources.some(s => s.basis === 'official-guidance'));
  assert.ok(sa.regional.taskReviews[0].requirements.sources.some(s => s.url === 'https://www.uqn.gov.sa/details?p=28771'));
  assert.equal(taskReview(ctx('SA'), 'confined').requirements.partial, true);
  assert.ok(!make('GB', ['height']).blocks.some(b => b.field?.key.endsWith('.scaffoldInspection')));
});

test('Russian extension notice confirms duration only and never upgrades all topics to current-law review', () => {
  for (const topic of ['height', 'confined', 'electrical']) {
    const doc = make('RU', [topic], 'ru-RU');
    const review = doc.regional.taskReviews[0];
    assert.equal(review.status, 'partial-source-review');
    assert.match(review.requirements.sources[0].scope, /duration only/);
    const notice = doc.blocks.find(b => b.field?.key === topic + '.notice').field.value;
    assert.match(notice, /2031-09-01/);
    assert.ok(notice.includes(taskSafetyText('ru-RU', 'pending')));
    assert.equal(doc.blocks.find(b => b.field?.key === topic + '.applicableEdition').field.value, '');
  }
  assert.equal(taskReview(ctx('RU'), 'hot').requirements.partial, true);
});

test('remaining batch covers exactly the 37 formerly baseline-only combinations with explicit scope', () => {
  const expected = {
    AU: ['height', 'electrical', 'hot'], SG: ['hot'],
    CA: ['height', 'electrical', 'hot'], 'CA-AB': ['height', 'electrical', 'hot'],
    'CA-BC': ['height', 'electrical', 'hot'], 'CA-ON': ['height', 'electrical', 'hot'],
    'CA-QC': ['height', 'electrical', 'hot'], DE: ['height', 'electrical', 'hot'],
    FR: ['height', 'confined', 'hot'], IT: ['height', 'electrical', 'hot'],
    ES: ['height', 'confined', 'hot'], SA: ['confined', 'electrical', 'hot'],
    BR: ['confined', 'hot'], RU: ['hot'],
  };
  const ids = Object.entries(expected).flatMap(([j, topics]) => topics.map(t => `${j}.${t}`)).sort();
  assert.equal(ids.length, 37);
  assert.deepEqual(Object.entries(REQUIREMENT_REVIEW_REMAINING_20261005)
    .flatMap(([j, topics]) => Object.keys(topics).map(t => `${j}.${t}`)).sort(), ids);
  for (const [j, topics] of Object.entries(expected)) for (const topic of topics) {
    const r = taskReview(ctx(j), topic);
    assert.equal(r.requirements.checkedAt, ['CA', 'CA-AB', 'CA-BC', 'CA-ON', 'AU', 'SG', 'DE', 'FR'].includes(j) ? '2026-10-06' : '2026-10-05');
    assert.ok(r.requirements.sources.every(s => s.scope && s.basis &&
      (['2026-10-05', '2026-10-06'].includes(s.checkedAt) || (['CA', 'CA-AB', 'CA-BC', 'CA-ON', 'AU', 'SG', 'DE', 'FR'].includes(j) && s.checkedAt === '2026-10-06'))));
    for (const locale of TASK_SAFETY_LANGUAGES) {
      const doc = make(j, [topic], WORK_JURISDICTIONS.find(p => p.locale.split('-')[0] === locale).locale);
      const note = doc.blocks.find(b => b.field?.key === `${topic}.notice`).field.value;
      assert.ok(note.includes(taskSafetyText(locale, r.requirements.noteKey)));
      for (const key of r.requirements.fields) {
        const field = doc.blocks.find(b => b.field?.key === `${topic}.${key}`).field;
        assert.equal(field.mode, 'runtime');
        assert.equal(field.value, '');
        assert.ok(field.label.includes(taskSafetyText(locale, r.requirements.fieldLabels?.[key] || key)));
      }
    }
  }
});

test('new Canadian and marine prompts preserve different plan triggers, sectors and roles', () => {
  const note = (j, t) => make(j, [t]).blocks.find(b => b.field?.key === `${t}.notice`).field.value;
  assert.match(note('CA-AB', 'height'), /3 m/);
  assert.match(note('CA-BC', 'height'), /7.5 m.*alternative procedures/);
  assert.doesNotMatch(note('CA', 'height'), /7.5 m/);
  assert.match(note('CA-ON', 'electrical'), /different scopes and exceptions/);
  assert.match(note('CA-QC', 'electrical'), /Do not substitute France/);
  assert.match(taskReview(ctx('SG'), 'hot').terms, /ship repair manager/);
  assert.doesNotMatch(taskReview(ctx('SG'), 'hot').terms, /authorised manager/);
  assert.match(taskReview(ctx('SG'), 'confined').terms, /authorised manager/);
  assert.ok(make('CA-AB', ['hot']).blocks.some(b => b.field?.key === 'hot.hotPermitTrigger'));
  assert.ok(!make('CA-AB', ['hot']).blocks.some(b => b.field?.label.includes('Entry-permit triggers')));
  assert.ok(make('IT', ['electrical']).blocks.some(b => b.field?.key === 'electrical.pesPavRecognition'));
  assert.ok(!make('IT', ['electrical']).blocks.some(b => b.field?.key === 'electrical.employerAuthorisation'));
});

test('source limitations stay visible in all languages and survive independent saved copies', () => {
  const limited = [['CA-QC', 'hot'], ['IT', 'height'], ['IT', 'electrical'],
    ['SA', 'confined'], ['SA', 'electrical'], ['SA', 'hot'], ['RU', 'hot']];
  for (const [j, topic] of limited) {
    for (const locale of TASK_SAFETY_LANGUAGES) {
      const doc = make(j, [topic], WORK_JURISDICTIONS.find(p => p.locale.split('-')[0] === locale).locale);
      const r = doc.regional.taskReviews[0];
      assert.equal(r.status, 'partial-source-review');
      assert.ok(r.requirements.remaining);
      assert.ok(doc.blocks.find(b => b.field?.key === `${topic}.notice`).field.value.includes(taskSafetyText(locale, 'pending')));
    }
    const record = { id: 'limited', data: cleanPackage({ context: ctx(j), documents: [make(j, [topic])] }) };
    const before = structuredClone(record);
    const run = startWork(record);
    assert.equal(run.documents[0].regional.taskReviews[0].requirements.remaining,
      record.data.documents[0].regional.taskReviews[0].requirements.remaining);
    duplicatePackage(record, 'Independent', 'ver.2').data.documents[0].regional.taskReviews[0].requirements.remaining = 'changed';
    assert.deepEqual(record, before);
  }
});

test('European distinct roles and Brazilian lifecycle never silently pre-authorise work', () => {
  assert.match(taskReview(ctx('DE'), 'hot').terms, /Brandposten.*Brandwache/);
  assert.match(taskReview(ctx('FR'), 'confined').terms, /Autorisation individuelle.*permis de pénétrer/);
  assert.ok(make('ES', ['confined']).blocks.some(b => b.field?.key === 'confined.preventivePresence'));
  assert.ok(!make('FR', ['confined']).blocks.some(b => b.field?.key === 'confined.preventivePresence'));
  const br = make('BR', ['confined', 'hot']);
  assert.match(br.blocks.find(b => b.field?.key === 'confined.notice').field.value, /24-hour cap is not an automatic validity period/);
  for (const topic of ['confined', 'hot']) {
    assert.equal(br.blocks.find(b => b.field?.key === `${topic}.permitRecord`).field.value, '');
    assert.equal(br.blocks.find(b => b.field?.key === `${topic}.restartReview`).field.value, '');
  }
  assert.ok(taskReview(ctx('BR'), 'hot').scopeNotes.includes('marineScope'));
  assert.match(taskReview(ctx('RU'), 'hot').requirements.remaining, /no automatic duration/);
});

test('follow-up amendments stay local and retain evidence without automatically closing country review', () => {
  const it = make('IT', ['height']);
  const keys = it.blocks.flatMap(b => b.field ? [b.field.key] : []);
  for (const key of ['fallSystemChoice', 'fixedLadderRecord', 'anchorCheck']) assert.ok(keys.includes('height.' + key));
  const itReview = it.regional.taskReviews[0];
  assert.equal(itReview.status, 'partial-source-review');
  assert.match(itReview.requirements.sources.find(s => s.url.includes('gazzettaufficiale')).scope, /over 5 m.*over 75 degrees/);
  assert.match(itReview.requirements.remaining, /later amendments/);
  assert.ok(!make('KR', ['height']).blocks.some(b => b.field?.key === 'height.fixedLadderRecord'));
  for (const topic of TASK_TYPES) {
    const sa = make('SA', [topic]);
    const r = sa.regional.taskReviews[0];
    assert.equal(r.status, 'partial-source-review');
    assert.deepEqual(r.requirements.resolvedIssues, ['sa-gazette-publication-date', 'sa-employer-validity-and-training-check']);
    assert.ok(sa.blocks.some(b => b.field?.key === `${topic}.occupationClassification`));
    assert.match(sa.blocks.find(b => b.field?.key === `${topic}.notice`).field.value, /2026-01-09.*180 days/);
    assert.doesNotMatch(sa.blocks.find(b => b.field?.key === `${topic}.notice`).field.value, /Publication, implementation and sector rules remain unverified/);
  }
  const br = taskReview(ctx('BR'), 'height');
  assert.equal(br.status, 'partial-source-review');
  assert.ok(br.requirements.fields.includes('ladderInspectionSchedule'));
  assert.equal(br.requirements.sources.filter(s => s.url.includes('portaria-mte-no-1-259')).length, 1);
  assert.match(br.requirements.remaining, /site-specific transition/);
});

test('updated evidence and terminology survive snapshots while new actual checks reset in all document languages', () => {
  for (const language of TASK_SAFETY_LANGUAGES) {
    const locale = WORK_JURISDICTIONS.find(p => p.locale.split('-')[0] === language).locale;
    for (const j of ['IT', 'SA', 'BR']) {
      const doc = make(j, ['height'], locale);
      const r = doc.regional.taskReviews[0];
      for (const key of [r.requirements.noteKey, ...r.requirements.additionalNotes]) {
        assert.ok(doc.blocks.find(b => b.field?.key === 'height.notice').field.value.includes(taskSafetyText(locale, key)));
      }
      for (const b of doc.blocks) if (b.field?.key.startsWith('height.') && b.field.mode === 'runtime') {
        b.field.value = 'OLD_FOLLOWUP_CHECK'; b.field.mode = 'standard';
      }
      const record = { id: 'followup', data: cleanPackage({ context: ctx(j, locale), documents: [doc] }) };
      const saved = structuredClone(record);
      const run = startWork(record);
      assert.doesNotMatch(JSON.stringify(run), /OLD_FOLLOWUP_CHECK/);
      assert.deepEqual(run.documents[0].regional.taskReviews[0].requirements.resolvedIssues, r.requirements.resolvedIssues);
      duplicatePackage(record, 'Copy', 'ver.2').data.documents[0].regional.taskReviews[0].requirements.resolvedIssues.push('changed');
      assert.deepEqual(record, saved);
    }
  }
});
