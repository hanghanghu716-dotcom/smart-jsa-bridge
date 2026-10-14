import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { SUPPORTED_LANGS, getDataLocale, getCaseLanguages } from '../src/locales/config.js';

export const AUDIT_TABLES = ['Hazards_Translations', 'Current_Measures_Translations',
  'Advanced_Measures_Translations', 'hazard_measure_mappings', 'current_advanced_measure_mappings', 'case_studies'];

const id = value => value == null ? null : String(value);
const blank = value => typeof value !== 'string' || !value.trim();
const validScore = score => score !== null && score !== '' && score !== undefined && Number.isFinite(Number(score)) && Number(score) >= -1 && Number(score) <= 1;

function mappingAudit(mappings, sources, targets, sourceKey, targetKey) {
  if (![mappings, sources, targets].every(Array.isArray)) return { status: 'not_loaded' };
  const sourceMap = new Map(sources.map(row => [id(row.id), row]));
  const targetMap = new Map(targets.map(row => [id(row.id), row]));
  const pairs = new Map();
  let missingSource = 0, missingTarget = 0, crossLocale = 0, invalidScore = 0, highScore = 0;
  for (const row of mappings) {
    const source = sourceMap.get(id(row[sourceKey])), target = targetMap.get(id(row[targetKey]));
    if (!source) missingSource++;
    if (!target) missingTarget++;
    if (source && target && source.locale !== target.locale) crossLocale++;
    if (!validScore(row.similarity_score)) invalidScore++;
    else if (Number(row.similarity_score) >= 0.95) highScore++;
    const key = JSON.stringify([id(row[sourceKey]), id(row[targetKey])]);
    pairs.set(key, (pairs.get(key) || 0) + 1);
  }
  return { status: 'observed', rows: mappings.length, missingSource, missingTarget, crossLocale, invalidScore, highScore,
    duplicatePairs: [...pairs.values()].filter(count => count > 1).length };
}

export function auditRecommendationSnapshot(snapshot) {
  const tables = snapshot.tables || snapshot;
  const count = (table, locale) => Array.isArray(tables[table]) ? tables[table].filter(row => row.locale === locale).length : null;
  const cases = tables.case_studies;
  const coverage = SUPPORTED_LANGS.map(locale => {
    const dataLocale = getDataLocale(locale) === 'ko' ? 'ko-KR' : getDataLocale(locale);
    const counts = { hazards: count('Hazards_Translations', dataLocale),
      controls: count('Current_Measures_Translations', dataLocale), additionalControls: count('Advanced_Measures_Translations', dataLocale) };
    const selected = Array.isArray(cases) ? cases.filter(row => getCaseLanguages(locale).includes(row.language_code)) : null;
    return { locale, dataLocale, sharedData: dataLocale !== (locale === 'ko' ? 'ko-KR' : locale), ...counts,
      exactLocaleCaseGroups: Array.isArray(cases) ? new Set(cases.filter(row => row.language_code === locale).map(row => row.post_group_id)).size : null,
      availableCaseGroups: selected ? new Set(selected.map(row => row.post_group_id)).size : null,
      observation: Object.values(counts).some(n => n === null) ? 'not_loaded' : Object.values(counts).some(n => n === 0) ? 'zero_rows_observed' : 'rows_observed',
      jurisdictionSuitability: 'not_verified' };
  });
  const translations = {};
  for (const [table, master, text] of [['Hazards_Translations', 'hazard_id', 'hazard_name'],
    ['Current_Measures_Translations', 'measure_id', 'measure_text'], ['Advanced_Measures_Translations', 'advanced_measure_id', 'solution_text']]) {
    const rows = tables[table];
    if (!Array.isArray(rows)) { translations[table] = { status: 'not_loaded' }; continue; }
    const keys = rows.filter(row => row[master] != null).map(row => JSON.stringify([id(row[master]), row.locale]));
    translations[table] = { status: 'observed', rows: rows.length, missingMaster: rows.filter(row => row[master] == null).length,
      blankText: rows.filter(row => blank(row[text])).length, missingLocale: rows.filter(row => blank(row.locale)).length,
      duplicateMasterLocaleRows: keys.length - new Set(keys).size };
  }
  return { schemaVersion: 1, capturedAt: snapshot.meta?.capturedAt || null,
    scope: 'Rows visible in the supplied snapshot; counts do not prove regional suitability or complete production visibility.',
    snapshotComplete: snapshot.meta?.complete === true, visibility: snapshot.meta?.visibility || 'not_verified',
    missingTables: AUDIT_TABLES.filter(table => !Array.isArray(tables[table])), coverage, translations,
    mappings: {
      hazardToControl: mappingAudit(tables.hazard_measure_mappings, tables.Hazards_Translations,
        tables.Current_Measures_Translations, 'hazard_translation_id', 'measure_translation_id'),
      currentToAdditional: mappingAudit(tables.current_advanced_measure_mappings, tables.Current_Measures_Translations,
        tables.Advanced_Measures_Translations, 'current_measure_translation_id', 'advanced_measure_translation_id')
    } };
}

export async function readRecommendationSnapshot({ url, key, fetcher = fetch, pageSize = 1000 }) {
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/i.test(endpoint.hostname) || endpoint.username || endpoint.password) {
    throw Error('Use the intended HTTPS Supabase project URL.');
  }
  if (!key) throw Error('A scoped Supabase read credential is required.');
  const tables = {};
  for (const table of AUDIT_TABLES) {
    const collected = [];
    for (let page = 0; ; page++) {
      if (page === 1000) throw Error(`Pagination limit reached for ${table}; no complete snapshot was produced.`);
      const target = new URL(`/rest/v1/${encodeURIComponent(table)}`, endpoint);
      target.searchParams.set('select', '*');
      target.searchParams.set('order', table.endsWith('_mappings') ? (table === 'hazard_measure_mappings' ? 'hazard_translation_id,measure_translation_id' : 'current_measure_translation_id,advanced_measure_translation_id') : 'id');
      const response = await fetcher(target, { headers: { apikey: key, Authorization: `Bearer ${key}`,
        Range: `${collected.length}-${collected.length + pageSize - 1}`, 'Range-Unit': 'items', Prefer: 'count=exact' } });
      if (!response.ok) throw Error(`Read failed for ${table} (HTTP ${response.status}); missing data was not treated as empty.`);
      const batch = await response.json();
      if (!Array.isArray(batch)) throw Error(`Unexpected response for ${table}.`);
      collected.push(...batch);
      const range = response.headers.get('content-range') || '';
      const total = /\/(\d+)$/.exec(range)?.[1];
      if (total != null && collected.length >= Number(total)) break;
      if (!batch.length) {
        if (total != null && collected.length < Number(total)) throw Error(`Incomplete pagination for ${table}.`);
        break;
      }
      // Continue even when the server caps a page below the requested size.
    }
    tables[table] = collected;
  }
  return { meta: { capturedAt: new Date().toISOString(), complete: true, visibility: 'credential_scope_not_independently_verified',
    consistency: 'sequential_reads_not_a_transactional_snapshot' }, tables };
}

async function main(args) {
  const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
  const input = option('--input'), output = option('--output');
  if (!output || (!input && !args.includes('--live'))) throw Error('Usage: node scripts/recommendation-data-audit.js --input snapshot.json --output report.json (or --live with SUPABASE_URL and SUPABASE_READ_KEY)');
  const snapshot = input ? JSON.parse(await fs.readFile(input, 'utf8'))
    : await readRecommendationSnapshot({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_READ_KEY });
  const report = auditRecommendationSnapshot(snapshot);
  await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true });
  await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ output, locales: report.coverage.length, missingTables: report.missingTables, snapshotComplete: report.snapshotComplete }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
