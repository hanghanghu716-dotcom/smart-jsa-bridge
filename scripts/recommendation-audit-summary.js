import { SUPPORTED_LANGS } from '../src/locales/config.js';

const count = value => Number.isInteger(value) && value >= 0 ? value : null;
const fields = (object, keys) => Object.fromEntries(keys.map(key => [key, count(object?.[key])]));
const locales = new Set(SUPPORTED_LANGS);
const translations = ['Hazards_Translations', 'Current_Measures_Translations', 'Advanced_Measures_Translations'];
const masters = ['Hazards', 'Current_Measures', 'Advanced_Measures'];
const mappingTables = ['hazard_measure_mappings', 'current_advanced_measure_mappings'];

// Explicit output allowlist: DB row text, row/source/project IDs and unknown future fields
// must never enter shared CI logs or artifacts. Detailed correction evidence stays private.
export function publicAuditSummary(report) {
  const knownTables = [...translations, ...masters, ...mappingTables, 'case_studies'];
  return {
    schemaVersion: 2,
    capturedAt: /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(report.capturedAt || '') ? report.capturedAt : null,
    snapshotComplete: report.snapshotComplete === true,
    visibility: 'public_anon_RLS_visible_rows_only',
    consistency: 'sequential_reads_not_transactional',
    disclosure: 'Aggregate counts only; no source text, row IDs, project identifiers or fingerprints.',
    failedTables: knownTables.filter(table => Object.hasOwn(report.failures || {}, table)),
    translations: Object.fromEntries(translations.map(table => [table, fields(report.translations?.[table],
      ['rows', 'missingMaster', 'blankText', 'missingLocale', 'duplicateMasterLocaleRows'])])),
    mappings: Object.fromEntries(['hazardToControl', 'currentToAdditional'].map(kind => [kind, fields(report.mappings?.[kind],
      ['rows', 'missingSource', 'missingTarget', 'crossLocale', 'invalidScore', 'highScore', 'duplicatePairs'])])),
    masterReferences: Object.fromEntries(masters.map(table => {
      const value = report.masterReferences?.[table];
      return [table, { ...fields(value, ['rows', 'missingReferencedMaster']),
        distinctMissingPublicMasterIds: Array.isArray(value?.missingMasterIds) ? value.missingMasterIds.length : null,
        affectedLocales: Object.fromEntries(Object.entries(value?.affectedLocales || {}).filter(([locale]) => locales.has(locale)).map(([locale, total]) => [locale, count(total)])) }];
    })),
    invalidTranslationLocales: Object.fromEntries(translations.map(table => {
      const rows = report.invalidTranslationLocales?.[table];
      const peers = rows?.flatMap(row => row.sameMasterTranslations || []);
      return [table, { rows: Array.isArray(rows) ? rows.length : null,
        sameMasterLocaleCounts: Array.isArray(rows) && rows.every(row => Array.isArray(row.sameMasterTranslations))
          ? Object.fromEntries([...locales].map(locale => [locale, peers.filter(peer => peer.locale === locale).length]).filter(([, total]) => total)) : null }];
    })),
    duplicateMappingKinds: Object.fromEntries(mappingTables.map(table => [table, fields(report.duplicateMappingKinds?.[table],
      ['identicalScorePairs', 'conflictingScorePairs', 'extraRows'])])),
    coverage: (report.coverage || []).filter(row => locales.has(row.locale) && locales.has(row.dataLocale)).map(row => ({
      locale: row.locale, dataLocale: row.dataLocale, sharedData: row.sharedData === true,
      ...fields(row, ['hazards', 'controls', 'additionalControls', 'exactLocaleCaseGroups', 'availableCaseGroups']),
      jurisdictionSuitability: 'not_verified' })),
    interpretation: 'Missing public masters may be hidden by RLS. Management inspection, review and backup are required before corrections.'
  };
}
