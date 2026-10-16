import { SUPPORTED_LANGS } from '../src/locales/config.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { auditRecommendationSnapshot, readRecommendationSnapshot, auditMasterKeys, auditMasterReferences, AUDIT_TABLES, MASTER_TABLES } from './recommendation-data-audit.js';

test('master references distinguish null, absent, ambiguous and unique identities without guessing', () => {
  const rows = [{ measure_id: null }, { measure_id: 99, locale: 'en-US' },
    { measure_id: '99', locale: 'ko-KR' }, { measure_id: 2 }, { measure_id: '1' }];
  const masters = [{ id: 1 }, { id: 2, text: 'A' }, { id: '2', text: 'A' }];
  const report = auditMasterReferences(rows, masters, 'measure_id');
  assert.equal(report.nullMasterReferences, 1);
  assert.equal(report.missingReferencedMaster, 2);
  assert.equal(report.distinctMissingMasterIds, 1);
  assert.equal(report.ambiguousMasterReferences, 1);
  assert.equal(report.distinctAmbiguousMasterIds, 1);
  assert.equal(report.uniqueMasterReferences, 1);
  assert.deepEqual(report.affectedLocales, { 'en-US': 1, 'ko-KR': 1 });
  assert.equal(report.translationRows, report.nullMasterReferences + report.missingReferencedMaster
    + report.ambiguousMasterReferences + report.uniqueMasterReferences);
  const snapshot = auditRecommendationSnapshot({ tables: { Current_Measures: masters, Current_Measures_Translations: rows } });
  assert.deepEqual(snapshot.masterReferences.Current_Measures, report);
});

test('unavailable masters stay unknown while an explicitly empty export yields absent references', () => {
  const rows = [{ hazard_id: 7 }, { hazard_id: null }];
  const unknown = auditMasterReferences(rows, undefined, 'hazard_id');
  assert.equal(unknown.status, 'not_loaded');
  assert.equal(unknown.missingReferencedMaster, null);
  assert.equal(unknown.ambiguousMasterReferences, null);
  assert.equal(unknown.nullMasterReferences, 1);
  assert.equal(auditMasterReferences(rows, [], 'hazard_id').missingReferencedMaster, 1);
  assert.equal(auditMasterReferences(undefined, [], 'hazard_id').missingReferencedMaster, null);
});

test('optional master export reads all three tables and propagates permission failures', async () => {
  const calls = [];
  const snapshot = await readRecommendationSnapshot({ url: 'https://test-project.supabase.co', key: 'test', includeMasters: true,
    fetcher: async url => {
      calls.push(url.pathname.split('/').at(-1));
      return { ok: true, headers: new Headers({ 'content-range': '*/0' }), json: async () => [] };
    } });
  assert.deepEqual(calls, [...AUDIT_TABLES, ...MASTER_TABLES]);
  assert.ok(MASTER_TABLES.every(table => Array.isArray(snapshot.tables[table])));
  await assert.rejects(readRecommendationSnapshot({ url: 'https://test-project.supabase.co', key: 'test', includeMasters: true,
    fetcher: async url => url.pathname.endsWith('/Hazards') ? { ok: false, status: 403 }
      : { ok: true, headers: new Headers({ 'content-range': '*/0' }), json: async () => [] } }), /Hazards.*403/);
});

test('master ID duplicates distinguish identical copies, conflicting content and unavailable fields', () => {
  const rows = [{ id: 1, text: 'One', parent: 5 }, { parent: 5, text: 'One', id: '1' },
    { id: 2, text: 'Two', parent: 5 }, { id: 2, text: 'Different', parent: 8 }, { id: null, text: 'Missing' }];
  assert.deepEqual(auditMasterKeys(rows), { status: 'observed', rows: 5, nullIdRows: 1,
    duplicateIdGroups: 2, extraDuplicateIdRows: 2, conflictingIdGroups: 1 });
  assert.equal(auditMasterKeys([{ id: 1 }, { id: 1 }]).conflictingIdGroups, null);
  assert.equal(auditMasterKeys(undefined).status, 'not_loaded');
  assert.equal(auditRecommendationSnapshot({ tables: { Current_Measures: rows } }).masterKeys.Current_Measures.conflictingIdGroups, 1);
});

test('missing exports remain unknown rather than creating false zero-country coverage', () => {
  const report = auditRecommendationSnapshot({ tables: { Hazards_Translations: [] } });
  assert.equal(report.coverage.length, SUPPORTED_LANGS.length);
  assert.equal(report.snapshotComplete, false);
  assert.equal(report.coverage.find(row => row.locale === 'ko').hazards, 0);
  assert.equal(report.coverage.find(row => row.locale === 'ko').controls, null);
  assert.ok(report.coverage.every(row => row.observation === 'not_loaded' && row.jurisdictionSuitability === 'not_verified'));
  assert.equal(report.mappings.hazardToControl.status, 'not_loaded');
});

test('language sharing does not certify local applicability and translated variants are deduplicated', () => {
  const report = auditRecommendationSnapshot({ tables: {
    Hazards_Translations: [{ id: 1, hazard_id: 2, locale: 'en-US', hazard_name: 'Pressure' }],
    Current_Measures_Translations: [], Advanced_Measures_Translations: [],
    case_studies: [{ id: 1, post_group_id: 'filter', language_code: 'en-CA' },
      { id: 2, post_group_id: 'filter', language_code: 'en-CA-ON' }],
  } });
  const sg = report.coverage.find(row => row.locale === 'en-SG');
  assert.equal(sg.hazards, 1); assert.equal(sg.sharedData, true);
  assert.equal(sg.jurisdictionSuitability, 'not_verified');
  const ontario = report.coverage.find(row => row.locale === 'en-CA-ON');
  assert.equal(ontario.availableCaseGroups, 1);
  assert.equal(ontario.exactLocaleCaseGroups, 1);
});

test('mapping audit identifies orphan IDs, cross-language joins, duplicates and invalid scores', () => {
  const report = auditRecommendationSnapshot({ tables: {
    Hazards_Translations: [{ id: 10, hazard_id: null, locale: 'ko-KR', hazard_name: '' }],
    Current_Measures_Translations: [{ id: 20, measure_id: 2, locale: 'en-US', measure_text: 'Control' }],
    hazard_measure_mappings: [
      { hazard_translation_id: 10, measure_translation_id: 20, similarity_score: 0.99 },
      { hazard_translation_id: 10, measure_translation_id: 20, similarity_score: 0.98 },
      { hazard_translation_id: 999, measure_translation_id: 888, similarity_score: null },
    ],
  } });
  assert.equal(report.translations.Hazards_Translations.missingMaster, 1);
  assert.equal(report.translations.Hazards_Translations.blankText, 1);
  assert.deepEqual(report.mappings.hazardToControl, { status: 'observed', rows: 3, missingSource: 1,
    missingTarget: 1, crossLocale: 2, invalidScore: 1, highScore: 2, duplicatePairs: 1 });
});

test('read-only export follows server-capped pages and never logs credentials', async () => {
  const calls = [];
  const snapshot = await readRecommendationSnapshot({ url: 'https://test-project.supabase.co', key: 'test-read-credential',
    fetcher: async (url, options) => {
      calls.push({ url: url.href, range: options.headers.Range, method: options.method || 'GET' });
      const first = options.headers.Range.startsWith('0-');
      return { ok: true, headers: new Headers({ 'content-range': first ? '0-0/2' : '1-1/2' }),
        json: async () => [{ id: first ? 1 : 2 }] };
    } });
  assert.equal(calls.length, AUDIT_TABLES.length * 2);
  assert.ok(calls.every(call => call.method === 'GET' && !call.url.includes('credential')));
  assert.ok(AUDIT_TABLES.every(table => snapshot.tables[table].length === 2));
  assert.equal(snapshot.meta.complete, true);
  assert.equal(snapshot.meta.consistency, 'sequential_reads_not_a_transactional_snapshot');
});

test('read errors and unintended credential destinations fail without inventing empty tables', async () => {
  await assert.rejects(readRecommendationSnapshot({ url: 'https://example.com', key: 'secret' }), /intended/);
  await assert.rejects(readRecommendationSnapshot({ url: 'https://test-project.supabase.co', key: 'secret',
    fetcher: async () => ({ ok: false, status: 403 }) }), /HTTP 403/);
});

