import test from 'node:test';
import assert from 'node:assert/strict';
import { terminologyText, terminologyHash } from './regional-terminology-fingerprint.js';
import { REGIONAL_CATALOG } from '../src/utils/regionalCatalog.js';
import { createRegionalTemplate } from '../src/utils/regionalWorkTemplates.js';
import { TASK_SAFETY_LANGUAGES, taskSafetyText } from '../src/locales/taskSafetyText.js';
import { WORK_DOCUMENT_LANGUAGES, WORK_JURISDICTIONS } from '../src/utils/workJurisdiction.js';
import { cleanPackage, startWork, duplicatePackage } from '../src/utils/workPackages.js';

test('title review hashes cover changed native names even when the interface language differs', () => {
  const before = terminologyText('title:SA.toolbox_talk');
  assert.equal(before.ar, 'اجتماع السلامة قبل بدء العمل');
  assert.match(before.en, /Toolbox Talk.*اجتماع السلامة/);
  assert.match(terminologyText('title:AU.method_statement').en, /SWMS/);
  assert.match(terminologyText('title:GB.method_statement').en, /Method Statement/);
  assert.match(terminologyText('title:SG.method_statement').en, /SWP/);
  assert.doesNotMatch(terminologyText('title:CA-QC.risk_assessment').fr, /DUERP/);
  assert.equal(terminologyText('title:KR.method_statement'), null);
  const original = REGIONAL_CATALOG.SA.titles.toolbox_talk;
  try {
    REGIONAL_CATALOG.SA.titles.toolbox_talk = 'Changed native title';
    assert.notEqual(terminologyHash(before), terminologyHash(terminologyText('title:SA.toolbox_talk')));
  } finally { REGIONAL_CATALOG.SA.titles.toolbox_talk = original; }
});

test('SG assessment records start fresh in ten languages, remain local, and preserve old saved snapshots', () => {
  const keys = ['sgRiskScope', 'sgRiskCommunication', 'sgRiskRecord'];
  for (const language of TASK_SAFETY_LANGUAGES) {
    const context = { jurisdiction: 'SG', documentLocale: WORK_DOCUMENT_LANGUAGES.find(l => l.split('-')[0] === language) };
    const doc = createRegionalTemplate('risk_assessment', context);
    for (const key of keys) {
      const field = doc.blocks.find(b => b.field?.key === key).field;
      assert.equal(field.label, taskSafetyText(language, key));
      assert.equal(field.mode, 'runtime'); assert.equal(field.value, '');
      field.mode = 'standard'; field.value = 'OLD_RECORD';
    }
    const saved = { id: 'sg', data: cleanPackage({ context, documents: [doc] }) };
    const snapshot = structuredClone(saved);
    assert.doesNotMatch(JSON.stringify(startWork(saved)), /OLD_RECORD/);
    const copy = duplicatePackage(saved, 'Copy', 'ver.2');
    copy.data.documents[0].title = 'Changed';
    assert.deepEqual(saved, snapshot);
    // Emulate a pre-update stored form. Starting it must not insert new fields.
    const legacy = structuredClone(saved);
    legacy.data.documents[0].regional.version = '2026-10-03.3';
    legacy.data.documents[0].blocks = legacy.data.documents[0].blocks.filter(b => !keys.includes(b.field?.key));
    const oldRun = startWork(legacy).documents[0];
    assert.equal(oldRun.regional.version, '2026-10-03.3');
    assert.ok(!oldRun.blocks.some(b => keys.includes(b.field?.key)));
  }
  for (const p of WORK_JURISDICTIONS.filter(j => j.id !== 'SG')) {
    const doc = createRegionalTemplate('risk_assessment', { jurisdiction: p.id, documentLocale: p.locale });
    assert.ok(!doc.blocks.some(b => keys.includes(b.field?.key)));
  }
  const permit = createRegionalTemplate('permit_to_work', { jurisdiction: 'SG', documentLocale: 'en-SG' });
  assert.ok(!permit.blocks.some(b => keys.includes(b.field?.key)));
});

test('common translations retain live-part, flashback, exit and instrument-identification meanings', () => {
  for (const [language, phrase] of [['fr', 'sous tension'], ['it', 'in tensione'], ['es', 'en tensión'], ['pt', 'energizadas'], ['ru', 'под напряжением']]) {
    assert.ok(taskSafetyText(language, 'earthBarrier').includes(phrase));
  }
  assert.match(taskSafetyText('it', 'cylinders'), /fiamma/);
  assert.match(taskSafetyText('es', 'cylinders'), /llama/);
  assert.match(taskSafetyText('pt', 'cylinders'), /chama/);
  assert.match(taskSafetyText('en', 'entryLog'), /everyone has exited/);
  assert.match(taskSafetyText('fr', 'instrument'), /Identifiant/);
  assert.match(taskSafetyText('ja', 'competence'), /力量/);
});
