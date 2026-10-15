import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAuditSummary } from './recommendation-audit-summary.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

test('shared audit output contains only counts and supported Locale names, never raw evidence', () => {
  const sentinel = 'PRIVATE_ROW_OR_PROJECT_SENTINEL';
  const report = { capturedAt: '2026-10-14T11:40:48.258Z', snapshotComplete: true, project: sentinel,
    snapshotDigest: sentinel, futureUnknownField: sentinel, highScoreExamples: { text: sentinel },
    masterKeys: { Current_Measures: { rows: 5, duplicateIdGroups: 2, conflictingIdGroups: 1, examples: [sentinel] } },
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
  assert.equal(result.masterKeys.Current_Measures.conflictingIdGroups, 1);
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

test('all 18 UI Locales survive aggregation including the distinct Korean database code', () => {
  const report = { coverage: SUPPORTED_LANGS.map(locale => ({ locale, dataLocale: locale === 'ko' ? 'ko-KR' : locale, hazards: 1 })),
    masterReferences: { Hazards: { affectedLocales: { 'ko-KR': 2 } } },
    invalidTranslationLocales: { Current_Measures_Translations: [{ sameMasterTranslations: [{ locale: 'ko-KR' }] }] } };
  const summary = publicAuditSummary(report);
  assert.equal(summary.coverage.length, 18);
  assert.equal(summary.coverage.find(row => row.locale === 'ko').dataLocale, 'ko-KR');
  assert.equal(summary.masterReferences.Hazards.affectedLocales['ko-KR'], 2);
  assert.equal(summary.invalidTranslationLocales.Current_Measures_Translations.sameMasterLocaleCounts['ko-KR'], 1);
});
