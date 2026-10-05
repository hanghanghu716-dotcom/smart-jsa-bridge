import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { terminologyText, terminologyHash } from './regional-terminology-fingerprint.js';
import { TASK_LOCAL_TERMS, TASK_TYPES } from '../src/utils/regionalTaskReview.js';
import { createRegionalTemplate, regionalTemplates } from '../src/utils/regionalWorkTemplates.js';
import { TASK_SAFETY_LANGUAGES, TASK_SAFETY_TEXT } from '../src/locales/taskSafetyText.js';
import { regionalFieldTranslations } from '../src/locales/regionalWorkText.js';
import { WORK_DOCUMENT_LANGUAGES } from '../src/utils/workJurisdiction.js';
import { startWork } from '../src/utils/workPackages.js';

test('native terminology fingerprints detect changes to either original roles or translated framing', () => {
  const id = 'native:AU.electrical';
  const original = terminologyHash(terminologyText(id));
  const terms = TASK_LOCAL_TERMS.AU.electrical, translated = TASK_SAFETY_TEXT.roles.ja;
  try {
    TASK_LOCAL_TERMS.AU.electrical = 'Any worker may perform electrical work';
    assert.notEqual(terminologyHash(terminologyText(id)), original);
    TASK_LOCAL_TERMS.AU.electrical = terms;
    TASK_SAFETY_TEXT.roles.ja = '承認済み';
    assert.notEqual(terminologyHash(terminologyText(id)), original);
  } finally {
    TASK_LOCAL_TERMS.AU.electrical = terms;
    TASK_SAFETY_TEXT.roles.ja = translated;
  }
  assert.equal(terminologyHash(terminologyText(id)), original);
  assert.equal(terminologyText('native:AU.unknown'), null);
});

test('reviewed native roles retain the work jurisdiction in all document languages and remain blank actuals', () => {
  const closures = JSON.parse(fs.readFileSync('docs/regional-terminology-closures.json', 'utf8')).filter(c => c.id.startsWith('native:'));
  assert.equal(closures.length, 71);
  for (const closure of closures) {
    const [jurisdiction, topic] = closure.id.slice(7).split('.');
    for (const documentLocale of WORK_DOCUMENT_LANGUAGES) {
      const form = createRegionalTemplate('permit_to_work', { jurisdiction, documentLocale }, null, { taskTypes: [topic] });
      const role = form.blocks.find(b => b.field?.key === topic + '.roles').field;
      assert.ok(role.label.endsWith(TASK_LOCAL_TERMS[jurisdiction][topic]));
      assert.equal(role.kind, 'worker');
      assert.equal(role.value, '');
      role.mode = 'standard'; role.value = 'OLD_APPROVER';
      assert.doesNotMatch(JSON.stringify(startWork({ data: { documents: [form] } })), /OLD_APPROVER/);
    }
  }
  assert.doesNotMatch(TASK_LOCAL_TERMS.AU.electrical, /licensed\/competent/);
  assert.match(TASK_LOCAL_TERMS.SG.confined, /confined space attendant/);
  assert.match(TASK_LOCAL_TERMS.SG.height, /work-at-height safety assessor/);
  assert.match(TASK_LOCAL_TERMS.SG.hot, /Marine hot-work permit/);
  for (const topic of TASK_TYPES) assert.notEqual(TASK_LOCAL_TERMS['CA-AB'][topic], TASK_LOCAL_TERMS['CA-BC'][topic]);
});

test('new generic permits distinguish current authorisation from an editable reusable record', () => {
  for (const jurisdiction of ['US', 'AU', 'SG']) for (const language of TASK_SAFETY_LANGUAGES) {
    const context = { jurisdiction, documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language) };
    assert.equal(regionalTemplates(context).find(t => t.kind === 'permit_to_work').recommended, false);
    const form = createRegionalTemplate('permit_to_work', context);
    assert.equal(form.regional.version, '2026-10-05.12');
    const field = key => form.blocks.find(b => b.field?.key === key)?.field;
    assert.equal(field('permitScope').value, TASK_SAFETY_TEXT.permitScope[language]);
    for (const key of ['competency', 'permitCoordination', 'issue', 'acceptance', 'handover']) {
      assert.equal(field(key).value, '');
      field(key).value = 'PRIOR_AUTHORISATION'; field(key).mode = 'standard';
    }
    assert.ok(form.blocks.findIndex(b => b.field?.key === 'permitCoordination') < form.blocks.findIndex(b => b.field?.key === 'issue'));
    assert.doesNotMatch(JSON.stringify(startWork({ data: { documents: [form] } })), /PRIOR_AUTHORISATION/);
    const saved = structuredClone(form);
    saved.regional.version = 'previous-custom-permit';
    saved.blocks = saved.blocks.filter(b => !['permitScope', 'competency', 'permitCoordination'].includes(b.field?.key));
    const restored = startWork({ data: { documents: [saved] } }).documents[0];
    assert.equal(restored.regional.version, 'previous-custom-permit');
    assert.equal(restored.blocks.some(b => b.field?.key === 'permitScope'), false);
  }
  // Removing unused dictionary keys must not remove live, distinct permit roles.
  for (const dictionary of Object.values(regionalFieldTranslations)) {
    assert.equal(dictionary['Applicant / site check / permit authority signatures'], undefined);
    assert.equal(dictionary['People at risk'], undefined);
    for (const key of ['Permit issuer', 'Site precautions verified by', 'People at risk and possible harm']) assert.ok(dictionary[key]);
  }
});
