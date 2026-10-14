import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAuditSummary } from './recommendation-audit-summary.js';

test('shared audit output contains only counts and supported Locale names, never raw evidence', () => {
  const sentinel = 'PRIVATE_ROW_OR_PROJECT_SENTINEL';
  const report = { capturedAt: '2026-10-14T11:40:48.258Z', snapshotComplete: true, project: sentinel,
    snapshotDigest: sentinel, futureUnknownField: sentinel, highScoreExamples: { text: sentinel },
    failures: { Hazards: sentinel },
    translations: { Hazards_Translations: { rows: 10, missingMaster: 2, extraText: sentinel } },
    masterReferences: { Hazards: { rows: 5, missingReferencedMaster: 2, missingMasterIds: [sentinel],
      examples: [{ text: sentinel }], affectedLocales: { ko: 2, [sentinel]: 9 } } },
    invalidTranslationLocales: { Current_Measures_Translations: [{ id: sentinel, locale: sentinel, text: sentinel,
      sameMasterTranslations: [{ id: sentinel, locale: 'de-DE', text: sentinel }] }] },
    coverage: [{ locale: 'ko', dataLocale: 'ko', hazards: 10, text: sentinel }, { locale: sentinel, dataLocale: sentinel }] };
  const result = publicAuditSummary(report);
  assert.equal(JSON.stringify(result).includes(sentinel), false);
  assert.equal(result.masterReferences.Hazards.distinctMissingPublicMasterIds, 1);
  assert.equal(result.translations.Hazards_Translations.rows, 10);
  assert.deepEqual(result.invalidTranslationLocales.Current_Measures_Translations.sameMasterLocaleCounts, { 'de-DE': 1 });
  assert.deepEqual(result.failedTables, ['Hazards']);
});

test('unavailable evidence is unknown and malformed count fields cannot leak raw values', () => {
  const result = publicAuditSummary({ snapshotComplete: false, translations: { Hazards_Translations: { rows: 'PRIVATE' } } });
  assert.equal(result.snapshotComplete, false);
  assert.equal(result.translations.Hazards_Translations.rows, null);
  assert.equal(result.invalidTranslationLocales.Current_Measures_Translations.rows, null);
  assert.equal(JSON.stringify(result).includes('PRIVATE'), false);
});
