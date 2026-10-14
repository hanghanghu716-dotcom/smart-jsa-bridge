import test from 'node:test';
import assert from 'node:assert/strict';
import { auditRecommendationSnapshot, readRecommendationSnapshot, AUDIT_TABLES } from './recommendation-data-audit.js';

test('missing exports remain unknown rather than creating false zero-country coverage', () => {
  const report = auditRecommendationSnapshot({ tables: { Hazards_Translations: [] } });
  assert.equal(report.coverage.length, 18);
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
